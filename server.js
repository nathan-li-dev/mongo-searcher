const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const app = express();

const port = parseInt(process.env.WEB_PORT);
const debugOutput = process.env.DEBUG_OUTPUT === "true";
const uri = process.env.CONNECTION_STRING;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

app.use(express.json());
app.use(express.static("public"));

// GET: main page
app.get("/", (req, res) => {
  if (debugOutput) {
    console.log("GET: main page");
  }
  res.sendFile(__dirname + "/index.html");
});

// POST: /search : search for entries in the DB based on the request
app.post("/search", (req, res) => {
  const {
    character,
    artist,
    sponsor,
    rarities,
    elements,
    traits,
    natures,
    characterSort,
    dateSort,
    skip,
    amount,
  } = req.body;

  // Print out the request details
  if (debugOutput) {
    console.log("POST: Search ");
    console.log("\tCharacter: " + character);
    console.log("\tArtist: " + artist);
    console.log("\tSponsor: " + sponsor);
    console.log("\tRarities: " + rarities);
    console.log("\tElements: " + elements);
    console.log("\tTraits: " + traits);
    console.log("\tNatures: " + natures);
    console.log("\tDateSort: " + dateSort);
    console.log("\tCharacterSort: " + characterSort);
    console.log("\tSkip: " + skip);
    console.log("\tAmount: " + amount);
    console.log();
  }

  // Get the data from the database
  (async () => {
    const results = await getData(
      character,
      artist,
      sponsor,
      rarities,
      elements,
      traits,
      natures,
      dateSort,
      characterSort,
      skip,
      amount
    );

    // Send the results back to the client
    res.send(JSON.stringify(results));
  })();
});

// Query the database and filter it based on search parameters
async function getData(
  character,
  artist,
  sponsor,
  rarities,
  elements,
  traits,
  natures,
  dateSort,
  characterSort,
  skip,
  amount
) {
  const db = client.db(process.env.DB_NAME);
  const cardCollection = db.collection(process.env.COLLECTION_NAME);

  // Build the query object that will be passed to the collection's find() method
  const query = { name: { $ne: "[DELETED]" } };
  if (character)
    query.characterTag = { $regex: `^(?i)${escapeRegExp(character)}` };
  if (artist) query.artistTag = artist;
  if (sponsor) query.sponsor = sponsor;
  if (rarities && !rarities.includes("Any")) query.Rarity = { $in: rarities };
  if (elements && !elements.includes("Any")) query.Element = { $in: elements };
  if (traits && !traits.includes("Any")) query.Trait = { $in: traits };
  if (natures && !natures.includes("Any")) query.Nature = { $in: natures };

  // Determine the total amount of items which meet the query requirements
  let amountFound = await cardCollection.countDocuments(query);

  // Build the sort object that will be passed to the collection's sort() method
  const sortObject =
    characterSort === "0"
      ? { _id: dateSort }
      : { characterTag: characterSort, _id: dateSort };

  // Get the data from the database
  let result = await cardCollection
    .find(query)
    .sort(sortObject)
    .skip(skip)
    .limit(amount);
  const values = await result.toArray();

  // Determine how many results are being shown to the client
  const isThereMore = amountFound > amount + skip;
  const amountShowing = isThereMore ? amount + skip : amountFound;

  if (debugOutput) {
    console.log(`\tThere are ${amountFound} TOTAL results for this search.`);
  }

  return {
    results: values,
    isThereMore,
    amountShowing,
    amountFound,
    imageBaseUrl: process.env.CHAR_IMG_BASE_URL,
  };
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

app.listen(port);
console.log(`Server listening at http://localhost:${port}`);
