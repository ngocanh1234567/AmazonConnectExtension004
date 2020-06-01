import cdk = require('@aws-cdk/core');
import * as lambda  from '@aws-cdk/aws-lambda';
import * as s3  from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
import * as cfn from '@aws-cdk/aws-cloudformation';
import fs = require('fs');

// 識別するためのタグ(バケット名にも使用されるので_は使えない)
const tag = "connect-ex-transcribe-004";
// Lambdaのタイムゾーン
const timeZone = 'Asia/Tokyo';
// Amazon Connectの設定を転記して下さい。
const wavBucketName = 'webapp-anhnn';

export class AmazonConnectExtension004Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 出力を保存するバケット名
    const outputBucketName = tag + "-bucket-" + this.account;

    // 録音データが保存されるバケット
    const wavBucket = s3.Bucket.fromBucketName(this, "wavBucket", wavBucketName);
    // 出力を保存するバケット
    const outputBucket = new s3.Bucket(this, tag + '-transcribeBucket', {
      bucketName: outputBucketName,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    })
  
    // Trannscribeを行うファンクション
    const transcribeFunction = new lambda.Function(this, tag + '-transcribeFunction', {
      functionName: tag + "-transcribeFunction",
      code: lambda.Code.asset('src/transcribeFunction'),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_12_X,
      timeout: cdk.Duration.seconds(300), // 変換に充分な時間を設定する
      environment: {
          OUTPUT_BUCKET: outputBucket.bucketName,
          TZ: timeZone
      },
    });

    // 録音ファイル生成時に、S3からトリガーできるようにパーミッションを付与する
    transcribeFunction.addPermission('AllowS3Invocation', {
      action: 'lambda:InvokeFunction',
      principal: new iam.ServicePrincipal('s3.amazonaws.com'),
      sourceArn: wavBucket.bucketArn
    });

    // 入力ファイルをダウンロードする権限を追加
    transcribeFunction.addToRolePolicy(new iam.PolicyStatement({
      resources: [wavBucket.bucketArn + "/*"],
      actions: ['s3:GetObject'] 
    }));
    // 出力ファイルをアップロードする権限を追加
    transcribeFunction.addToRolePolicy(new iam.PolicyStatement({
      resources: [outputBucket.bucketArn + "/*"],
      actions: ['s3:PutObject'] 
    }));
    // Transcribeを操作する権限を追加
    transcribeFunction.addToRolePolicy(new iam.PolicyStatement({
      resources: ["*"],
      actions: ['transcribe:*'] 
    }));
  
    // S3にWAVが保存された時のイベントにトリガーを仕掛けるファンクション
    const setNotificationFunction = new lambda.SingletonFunction(this, tag + '-setNotificationFunction', {
      uuid: 'fa394ca7-e346-4a71-9fc1-0e9d03e7edd0',
      code: new lambda.InlineCode(fs.readFileSync('src/setNotificationFunction/index.js', { encoding: 'utf-8' })),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(300),
      runtime: lambda.Runtime.NODEJS_8_10,
    });
    
    // イベントにトリガーを追加削除する権限付与
    setNotificationFunction.addToRolePolicy(new iam.PolicyStatement({
      resources: [wavBucket.bucketArn],
      actions: ['s3:*'] }
    ));

    // カスタムリソース
    new cfn.CustomResource(this, 'custom-resource', {
        provider: cfn.CustomResourceProvider.lambda(setNotificationFunction),
        properties: {
            "REGION": this.region,
            "ACCOUNT": this.account,
            "BUCKET_NAME": wavBucket.bucketName,
            "FUNCTION_NAME": transcribeFunction.functionName
        }
    });

    // 出力に設定ファイル用バケット名を表示
    new cdk.CfnOutput(this, "TranscribeBucket", {
      value: outputBucket.bucketName
    });
  }
}




 