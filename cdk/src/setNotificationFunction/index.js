
"use strict";
const AWS = require('aws-sdk');
const cfnresponse = require('cfn-response');

const s3 = new AWS.S3();

exports.handler = (event, context) => {
    console.log(JSON.stringify(event));
    console.log(JSON.stringify(context));

    const requestType = event['RequestType']; // Create, Delete, Update
    const resourcePropertie = event['ResourceProperties']; // Papameters from CDK

    const account = resourcePropertie.ACCOUNT;
    const region = resourcePropertie.REGION;
    const bucketName = resourcePropertie.BUCKET_NAME;
    const functionName = resourcePropertie.FUNCTION_NAME;

    if (requestType == 'Create') {
        const params = {
            Bucket: bucketName,
            NotificationConfiguration: {
                LambdaFunctionConfigurations: [
                    {
                        Id: `lambda-upload-notification-${bucketName}`,
                        LambdaFunctionArn: `arn:aws:lambda:${region}:${account}:function:${functionName}`,
                        Events: ['s3:ObjectCreated:*'],
                        Filter: {
                            Key: {
                                FilterRules: [
                                {
                                  Name: "suffix",
                                  Value: ".wav"
                                }
                              ]
                            }
                        }
                    },
                ]
            }
        };
        s3.putBucketNotificationConfiguration(params, function(err, data) {
            if(err){
                send(event, context, err, {});
            } else {
                send(event, context, null, {});
            }
        });
    
    } else if (requestType == 'Delete') {
        const params = {
            Bucket: bucketName,
            NotificationConfiguration: {}
        };
        s3.putBucketNotificationConfiguration(params, function(err, data) {
            if(err){
                send(event, context, err, {});
            } else {
                send(event, context, null, {});
            }
        });
    } else {
        send(event, context, null, {});
    } 
};

function send(event, context, err, data) {
    if(err){
        console.log(err);
        cfnresponse.send(event, context, cfnresponse.FAILED, {});
    } else {
        cfnresponse.send(event, context, cfnresponse.SUCCESS, data);
    }
}
