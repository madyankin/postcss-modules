import { writeFileSync } from 'fs';

export default function saveJSON(cssFile, json) {
  writeFileSync(`${ cssFile }.json`, JSON.stringify(json));
}
