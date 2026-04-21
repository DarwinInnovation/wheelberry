import * as express from 'express';
import type { RequestHandler } from 'express';
import { AlexaIntent } from './alexaInterface';
import * as _ from 'lodash';
import { Logger } from 'pino';
import path from 'path';
import { AlexaSkill, AlexaSkillError } from './AlexaSkill';
import type { IUser } from './db/index.js';

interface AlexaSkillWebIntent {
  intent: AlexaIntent;
  handler: (req: Express.Request, res: Express.Response) => Promise<void>
}

export class AlexaSkillWeb {
  private intents: {
    [key: string]: AlexaSkillWebIntent
  } = {};

  constructor(protected log: Logger, private skillName: string, private alexa_skill: AlexaSkill) {
  }

  public express(express_app: express.Application, endpoint: string, requireAuth: RequestHandler) {
    express_app.get(endpoint, requireAuth, (req, res) => {
      res.render('skill', {
        skillName: this.skillName,
        intents: this.intents,
        user: req.user,
      });
    });

    _.each(this.intents, (intent, name) => {
      this.log.info(`Adding endpoint for ${name}`);
      express_app.get(endpoint + '/' + name, requireAuth, (req, res) => {
        const user = (req.user as IUser)?.email;
        const cmd = path.basename(req.path);

        if (!user) {
          res.status(401).send('Not authenticated');
          return;
        }

        this.log.info(`Forward ${user} ${cmd}`);

        this.alexa_skill.forward(user, cmd, {})
          .then(() => {
            res.end(`${cmd} done.`);
          })
          .catch((err) => {
            if (err instanceof AlexaSkillError) {
              const alexa_skill_err = err as AlexaSkillError;
              res.status(alexa_skill_err.status_code);
              res.send(alexa_skill_err.description);
            } else {
              res.status(500);
              res.send(err.message);
            }
          });
      });
    });
  }

  public intent(intent: AlexaIntent, handler: (req: Express.Request, res: Express.Response) => Promise<void>) {

    this.intents[intent.name] = {
      intent,
      handler
    }
  }
}