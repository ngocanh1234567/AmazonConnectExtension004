#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { AmazonConnectExtension004Stack } from '../lib/cdk-stack';

const app = new cdk.App();
new AmazonConnectExtension004Stack(app, 'AmazonConnectExtension004Stack');
