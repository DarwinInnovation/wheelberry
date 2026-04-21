import {
  SkillBuilders,
  HandlerInput,
  RequestHandler,
  ErrorHandler as AskErrorHandler,
  RequestInterceptor,
} from 'ask-sdk-core';
import { ExpressAdapter } from 'ask-sdk-express-adapter';
import { IntentRequest, Response } from 'ask-sdk-model';
import {
  AlexaIntent,
  AlexaSkillModel
} from './alexaInterface';
import { Logger } from 'pino';
import { inspect } from 'util';
import * as _ from 'lodash';
import axios from 'axios';
import { WheelberryProxyServer } from './WheelberryProxyServer';
import { WheelberryProxyApp } from './WheelberryProxyApp';
import { WheelberryProxyConnection } from './WheelberryProxyConnection';
import { AlexaSkillWeb } from "./AlexaSkillWeb";
import * as express from 'express';
import type { RequestHandler as ExpressRequestHandler } from 'express';

export interface AlexaSkillOptions {
  phoneticName?: string;
  needsLink?: boolean;
  applicationId?: string;
}

export interface AlexaUser {
  user_id: string;
  name: string;
  email: string;
}

export class AlexaSkillError extends Error {
  constructor(readonly status_code: number, readonly description: string) {
    super(`${description} (HTTP Status Code ${status_code})`);
  }
}

const DEFAULT_INTENT_NAMES = new Set([
  "AMAZON.FallbackIntent",
  "AMAZON.CancelIntent",
  "AMAZON.HelpIntent",
  "AMAZON.StopIntent",
  "AMAZON.NavigateHomeIntent",
]);

export class AlexaSkill {
  private skill: ReturnType<ReturnType<typeof SkillBuilders.custom>['create']>;
  private web_app: AlexaSkillWeb;
  private options: AlexaSkillOptions;
  private wbApp: WheelberryProxyApp | null;

  constructor(protected log: Logger, public name: string, private skillModel: AlexaSkillModel, options?: AlexaSkillOptions) {
    this.web_app = new AlexaSkillWeb(log, name, this);

    this.options = _.defaults({}, options, {
      phoneticName: this.name,
      needsLink: false,
      applicationId: '',
    });

    this.wbApp = null;
    this.skill = this._buildSkill();
  }

  /** Register the Alexa POST endpoint (no web auth — Amazon validates via its own OAuth) */
  public expressAlexa(express_app: express.Application) {
    const adapter = new ExpressAdapter(this.skill, true, true);
    express_app.post('/alexa/' + this.name, adapter.getRequestHandlers());
  }

  /** Register the web skill UI endpoints (protected by requireAuth middleware) */
  public expressWeb(express_app: express.Application, requireAuth: ExpressRequestHandler) {
    this.web_app.express(
      express_app,
      '/skill/' + this.name,
      requireAuth
    );
  }

  public wheelberry(server: WheelberryProxyServer) {
    this.wbApp = server.createApp(this.name);
  }

  // --- Built-in handlers ---

  protected onLaunch(handlerInput: HandlerInput): Response {
    this.log.info(`AlexaSkill[${this.name}]: %s`, inspect(handlerInput.requestEnvelope.context.System.user));

    if (this.options.needsLink && !handlerInput.requestEnvelope.context.System.user?.accessToken) {
      return handlerInput.responseBuilder
        .speak(this.phoneticName + ' needs linking with your Amazon account')
        .withLinkAccountCard()
        .getResponse();
    }

    return handlerInput.responseBuilder
      .speak(this.phoneticName + ' skill opened. What would you like to do?')
      .reprompt('What would you like to do?')
      .withShouldEndSession(false)
      .getResponse();
  }

  protected getHelpResponse(): string {
    return 'You can say commands.';
  }

  protected intent_AMAZON_HelpIntent(handlerInput: HandlerInput): Response {
    return handlerInput.responseBuilder
      .speak(this.getHelpResponse())
      .reprompt('What would you like to do?')
      .withShouldEndSession(false)
      .getResponse();
  }

  protected intent_AMAZON_StopIntent(handlerInput: HandlerInput): Response {
    return handlerInput.responseBuilder.speak('App stopped').getResponse();
  }

  protected intent_AMAZON_CancelIntent(handlerInput: HandlerInput): Response {
    return handlerInput.responseBuilder.speak('Okay. Cancelled').getResponse();
  }

  protected intent_AMAZON_FallbackIntent(handlerInput: HandlerInput): Response {
    return handlerInput.responseBuilder
      .speak(`Sorry, I didn't catch that.`)
      .reprompt(`What did you want ${this.name} to do?`)
      .getResponse();
  }

  protected intent_AMAZON_NavigateHomeIntent(handlerInput: HandlerInput): Response {
    return handlerInput.responseBuilder.speak('Bye bye').getResponse();
  }

  // --- Skill construction ---

  private _buildSkill() {
    const handlers: RequestHandler[] = [];

    // Launch handler
    handlers.push({
      canHandle: (handlerInput) => handlerInput.requestEnvelope.request.type === 'LaunchRequest',
      handle: (handlerInput) => this.onLaunch(handlerInput),
    });

    // Intent handlers from the skill model
    const intents = this.skillModel.interactionModel.languageModel.intents;
    for (const intent of intents) {
      if (DEFAULT_INTENT_NAMES.has(intent.name)) {
        handlers.push(this._createDefaultIntentHandler(intent.name));
      } else {
        handlers.push(this._createIntentHandler(intent.name, intent));
        this.web_app.intent(intent, async () => {
          // handler not used; AlexaSkillWeb.express() calls forward() directly
        });
      }
    }

    return SkillBuilders.custom()
      .addRequestHandlers(...handlers)
      .addRequestInterceptors(this._createRequestInterceptor())
      .addErrorHandlers(this._createErrorHandler())
      .create();
  }

  private _createDefaultIntentHandler(intentName: string): RequestHandler {
    const methodMap: Record<string, (handlerInput: HandlerInput) => Response> = {
      "AMAZON.FallbackIntent": (h) => this.intent_AMAZON_FallbackIntent(h),
      "AMAZON.CancelIntent": (h) => this.intent_AMAZON_CancelIntent(h),
      "AMAZON.HelpIntent": (h) => this.intent_AMAZON_HelpIntent(h),
      "AMAZON.StopIntent": (h) => this.intent_AMAZON_StopIntent(h),
      "AMAZON.NavigateHomeIntent": (h) => this.intent_AMAZON_NavigateHomeIntent(h),
    };

    return {
      canHandle: (handlerInput) =>
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        (handlerInput.requestEnvelope.request as IntentRequest).intent.name === intentName,
      handle: methodMap[intentName],
    };
  }

  private _createIntentHandler(intentName: string, intent: AlexaIntent): RequestHandler {
    const slots = intent.slots || [];

    return {
      canHandle: (handlerInput) =>
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        (handlerInput.requestEnvelope.request as IntentRequest).intent.name === intentName,
      handle: async (handlerInput) => {
        const requestSlots = (handlerInput.requestEnvelope.request as IntentRequest).intent.slots;
        const values = slots.map((slot) => requestSlots?.[slot.name]?.value);
        return this.alexaForward(handlerInput, intentName, values);
      },
    };
  }

  private _createRequestInterceptor(): RequestInterceptor {
    return {
      process: async (handlerInput) => {
        const requestAppId = handlerInput.requestEnvelope.context.System.application?.applicationId;
        if (this.options.applicationId && requestAppId !== this.options.applicationId) {
          throw new Error('Incorrect application ID');
        }

        const userId = handlerInput.requestEnvelope.session?.user?.userId;
        const accessToken = handlerInput.requestEnvelope.context.System.user?.accessToken;

        if (userId && accessToken) {
          const amznProfileUrl = `https://api.amazon.com/user/profile?access_token=${encodeURIComponent(accessToken)}`;
          const userResponse = await axios.get(amznProfileUrl);
          this.log.info(`AlexaSkill[${this.name}]: User %s`, inspect(userResponse.data));

          const attrs = handlerInput.attributesManager.getRequestAttributes();
          attrs.user = userResponse.data;

          if (attrs.user && this.wbApp) {
            const uid = await this.wbApp.getUid(attrs.user.email);

            if (uid) {
              const connection = this.wbApp.getUidConnection(uid);
              this.log.info(`AlexaSkill[${this.name}]: Connection ${connection}`);
              attrs.wheelberry = { uid, connection };
            }
          }
        }
      },
    };
  }

  private _createErrorHandler(): AskErrorHandler {
    return {
      canHandle: () => true,
      handle: (handlerInput, error) => {
        this.log.error(error);
        return handlerInput.responseBuilder
          .speak('Sorry, something went wrong.')
          .getResponse();
      },
    };
  }

  // --- Command forwarding ---

  async alexaForward(
    handlerInput: HandlerInput,
    cmd: string,
    args: any[],
    replyCb?: (status: any) => string
  ): Promise<Response> {
    const userId = handlerInput.requestEnvelope.session?.user?.userId;
    const attrs = handlerInput.attributesManager.getRequestAttributes();
    const wheelberry = attrs.wheelberry as { uid: string; connection?: WheelberryProxyConnection } | undefined;

    if (!userId) {
      return handlerInput.responseBuilder.speak('No user').getResponse();
    } else if (!wheelberry) {
      return handlerInput.responseBuilder.speak('User not known to Wheelberry').getResponse();
    } else if (!wheelberry.connection) {
      this.log.info(wheelberry);
      return handlerInput.responseBuilder.speak('No active connection from ' + this.phoneticName).getResponse();
    }

    try {
      const result = await wheelberry.connection.sendCommand(cmd, args);
      let reply = `${this.phoneticName} ${cmd} okay`;
      if (replyCb) {
        reply = replyCb(result);
      }
      return handlerInput.responseBuilder.speak(reply).getResponse();
    } catch (err) {
      this.log.error(err as Error);
      return handlerInput.responseBuilder.speak('Sorry, that failed.').getResponse();
    }
  }

  async forward(user: string, cmd: string, args: any) {
    if (!this.wbApp) {
      throw new AlexaSkillError(500, 'No Wheelberry app');
    }

    if (!user) {
      throw new AlexaSkillError(403, 'No user specified');
    } else if (!(await this.wbApp.checkUserExists(user))) {
      throw new AlexaSkillError(403, 'User not recognized');
    } else if (!(await this.wbApp.checkUserConnected(user))) {
      throw new AlexaSkillError(503, 'User not connected at present');
    }

    const uid = (await this.wbApp.getUid(user))!;
    const conn = this.wbApp.getUidConnection(uid);
    if (conn) {
      await conn.sendCommand(cmd, args);
    }
  }

  get phoneticName(): string {
    return this.options.phoneticName || '';
  }
}
