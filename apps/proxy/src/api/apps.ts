import { Router } from 'express';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import type { WheelberryProxyServer } from '../WheelberryProxyServer.js';
import type { AlexaSkillModel } from '../alexaInterface.js';

const DEFAULT_INTENT_NAMES = new Set([
  'AMAZON.FallbackIntent',
  'AMAZON.CancelIntent',
  'AMAZON.HelpIntent',
  'AMAZON.StopIntent',
  'AMAZON.NavigateHomeIntent',
]);

export function appsRouter(server: WheelberryProxyServer): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    const cfgDir = server.getCfgDir();
    const skillsDir = path.join(cfgDir, 'skills');

    let files: string[];
    try {
      files = readdirSync(skillsDir).filter((f) => f.endsWith('.json'));
    } catch {
      files = [];
    }

    const apps = files.map((file) => {
      const name = path.basename(file, '.json');
      try {
        const model: AlexaSkillModel = JSON.parse(readFileSync(path.join(skillsDir, file), 'utf-8'));
        const intents = model.interactionModel.languageModel.intents
          .filter((i) => !DEFAULT_INTENT_NAMES.has(i.name))
          .map((i) => ({
            name: i.name,
            slots: (i.slots || []).map((s) => s.name),
          }));
        return { name, intents };
      } catch {
        return { name, intents: [] };
      }
    });

    res.json(apps);
  });

  return router;
}
