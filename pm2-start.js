import config from './ecosystem.config.js';
import { spawn } from 'child_process';

const pm2Args = ['start', '--node-args="--experimental-modules"', './server.js'];

if (process.env.NODE_ENV === 'production') {
  pm2Args.push('--env', 'production');
}

const pm2Process = spawn('pm2', pm2Args, {
  stdio: 'inherit',
  shell: true
});

pm2Process.on('error', (err) => {
  console.error('Failed to start PM2:', err);
  process.exit(1);
}); 