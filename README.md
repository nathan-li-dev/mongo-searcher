# mongo-searcher

Web interface for searching and filtering data from a remote mongodb server

## Config

```
CONNECTION_STRING="Your mongodb connection string"
DB_NAME="Your db name"
COLLECTION_NAME="Your db collection name"
CHAR_IMG_BASE_URL="Your base document image url"
DEBUG_OUTPUT="true/false"
WEB_PORT=3000
```

## Main files:

server.js - serves the page on port 3000, receives POST requests to query the database
public/script.js - sends requests to the server, displays the response from the database
