import * as std from '@jkcfg/std';
import * as fs from '@jkcfg/std/fs';

const isYAML = name => name.endsWith(".yaml") || name.endsWith(".yml");

function resolveFileContent(generateArray) {
  return Promise.resolve(generateArray).then(entries => {
    return Promise.all(entries.map(o => o.value)).then(values => {
      entries.forEach((o, i) => {
        o.value = values[i];
      });
      return entries;
    });
  })
}

export function generate(path) {
    const entries = [];

    for (const f of fs.walk(path)) {
        if (f.isdir) {
            continue;
        }
        if (isYAML(f.path)) {
            entries.push({ path: f.path, value: std.read(f.path) });
        }
    }

    return resolveFileContent(entries);
}
