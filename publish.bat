del index.zip
7z a index.zip @listfile
aws lambda update-function-code --function-name OneCary --zip-file fileb://index.zip
PAUSE
