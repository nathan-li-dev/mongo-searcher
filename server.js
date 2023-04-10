const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const app = express();

console.log(process.env.CONNECTION_STRING);
const uri = process.env.CONNECTION_STRING;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
const imageBaseUrl = process.env.CHAR_IMG_BASE_URL;

app.use(express.json());
app.use(express.static("public"));

// GET: main page
app.get("/", (req, res) => {
  console.log("GET: main page");
  res.sendFile(__dirname + "/index.html");
});
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

    res.send(JSON.stringify(results));
  })();
});

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

  const query = { name: { $ne: "[DELETED]" } };
  if (character) query.characterTag = character;
  if (artist) query.artistTag = artist;
  if (sponsor) query.sponsor = sponsor;
  if (rarities && !rarities.includes("Any")) query.Rarity = { $in: rarities };
  if (elements && !elements.includes("Any")) query.Element = { $in: elements };
  if (traits && !traits.includes("Any")) query.Trait = { $in: traits };
  if (natures && !natures.includes("Any")) query.Nature = { $in: natures };

  const sortObject =
    characterSort === "0"
      ? { _id: dateSort }
      : { characterTag: characterSort, _id: dateSort };
  console.log(sortObject);

  let amountFound = await cardCollection.countDocuments(query);
  console.log(
    "\tThere are: " + amountFound + " TOTAL results for this search."
  );
  let result = await cardCollection
    .find(query)
    .sort(sortObject)
    .skip(skip)
    .limit(amount);

  const values = await result.toArray();

  const isThereMore = amountFound > amount + skip;
  const amountShowing = isThereMore ? amount + skip : amountFound;

  return {
    results: values,
    isThereMore,
    amountShowing,
    amountFound,
    baseUrl: imageBaseUrl,
  };
}

app.listen(3000);
console.log("Server listening at http://localhost:3000");
