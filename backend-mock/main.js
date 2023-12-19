const http = require('http');
const fs = require('fs');

const routes = {
  'api': {
    'app': (res, app_id) => {
      if (app_id === undefined) {
        fs.readdir('./db/app/', (err, files) => {
          if (err) {
            console.error(err);
            res.statusCode = 500;
            res.end('500');
            return;
          }
          const apps = [];
          files.forEach(file => {
            apps.push(JSON.parse(fs.readFileSync(`./db/app/${file}`, { encoding: 'utf8', flag: 'r' })));
          });
          res.end(JSON.stringify(apps));
        });
      } else {
        fs.readFile(`./db/app/${app_id}`, { encoding: 'utf8', flag: 'r' }, (err, data) => {
          if (err) {
            console.error(err);
            res.statusCode = 500;
            res.end('500');
            return;
          }
          res.end(data);
        });
      }
    },
    'prompt': (res, prompt_id, offsprings) => {
      if (offsprings === undefined) {
        fs.readFile(`./db/prompt/${prompt_id}`, { encoding: 'utf8', flag: 'r' }, (err, data) => {
          if (err) {
            console.error(err);
            res.statusCode = 500;
            res.end('500');
            return;
          }
          res.end(data);
        });
      } else {
        fs.readdir(`./db/prompt/`, (err, files) => { // VERY INEFFICIENT!!!
          if (err) {
            console.error(err);
            res.statusCode = 500;
            res.end('500');
            return;
          }
          const prompts = {};
          prompt_hashes = [];
          files.forEach(file => {
            prompts[file] = JSON.parse(fs.readFileSync(`./db/prompt/${file}`, { encoding: 'utf8', flag: 'r' }));
            prompt_hashes.push(file);
          });
          if (prompts[prompt_id] === undefined) {
            console.error('Root node not found');
            res.end('[]');
            return;
          }
          const findOffsprings = (root) => {
            const offsprings = [];
            prompt_hashes.filter(node => prompts[node].parent_version === root).forEach(child => {
              offsprings.push(...findOffsprings(child));
            });
            offsprings.push(root);
            return offsprings;
          }
          res.end(JSON.stringify(Object.fromEntries(findOffsprings(prompt_id).map(node => [node, prompts[node]]))));
        });
      }
    },
    'test': (res, test_id) => {
      fs.readFile(`./db/test/${test_id}`, { encoding: 'utf8', flag: 'r' }, (err, data) => {
        if (err) {
          console.error(err);
          res.statusCode = 500;
          res.end('500');
          return;
        }
        res.end(data);
      });
    },
    'model': (res, model_id) => {
      if (model_id === undefined) {
        fs.readdir('./db/model/', (err, files) => {
          if (err) {
            console.error(err);
            res.statusCode = 500;
            res.end('500');
            return;
          }
          const models = [];
          files.forEach(file => {
            models.push(JSON.parse(fs.readFileSync(`./db/model/${file}`, { encoding: 'utf8', flag: 'r' })));
          });
          res.end(JSON.stringify(models));
        });
      } else {
        fs.readFile(`./db/model/${model_id}`, { encoding: 'utf8', flag: 'r' }, (err, data) => {
          if (err) {
            console.error(err);
            res.statusCode = 500;
            res.end('500');
            return;
          }
          res.end(data);
        });
      }
    },
    'output': (res, prompt_id, model_id, test_id, run_id) => {
      if (run_id === undefined) {
        fs.readdir(`./db/output/${prompt_id}/${model_id}/${test_id}`, (err, files) => {
          if (err) {
            console.error(err);
            res.statusCode = 500;
            res.end('500');
            return;
          }
          const outputs = [];
          files.forEach(file => {
            outputs.push(JSON.parse(fs.readFileSync(`./db/output/${prompt_id}/${model_id}/${test_id}/${file}`, { encoding: 'utf8', flag: 'r' })));
          });
          res.end(JSON.stringify(outputs));
        });
      } else {
        fs.readFile(`./db/output/${prompt_id}/${model_id}/${test_id}/${run_id}`, { encoding: 'utf8', flag: 'r' }, (err, data) => {
          if (err) {
            console.error(err);
            res.statusCode = 500;
            res.end('500');
            return;
          }
          res.end(data);
        });
      }
    },
  },
};

const route = (segments, node) => {
  if (typeof node === 'function') {
    return (res) => node(res, ...segments);
  }
  if (segments[0] in node) {
    return route(segments.slice(1), node[segments[0]]);
  }
  return (res) => res.end('404');
};

http.createServer(function (req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Access-Control-Allow-Origin': 'http://localhost:8080',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Requested-Method': '*',
  });
  route(req.url.split(/\/+/).slice(1), routes)(res);
}).listen(8088);