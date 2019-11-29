#--------------- Lambdaのみ更新 ---------------------------
export Profile=develop
export ZipName=/tmp/upload.zip
export FunctionNam=connect-ex-transcribe-004-transcribeFunction

rm ${ZipName} 
cd dst
zip -r ${ZipName} *
aws lambda update-function-code --function-name ${FunctionNam}  --zip-file fileb://${ZipName} --publish --p ${Profile}


