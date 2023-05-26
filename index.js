const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 9988;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@cluster0.ugrpd0k.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

    const toyCollection = client.db('toyCollection').collection('toys');
    // get all server data
    app.get('/alltoys', async (req, res) => {
      const cursor = toyCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // Creating index on two fields
    const indexKeys = { toyName: 1 }
    const indexOptions = { name: "toyName" };
    const result = await toyCollection.createIndex(indexKeys, indexOptions);

    app.get("/searchBy/:toyname", async (req, res) => {
      const search = req.params.toyname;
      const result = await toyCollection.find({
        $or: [{ toyName: { $regex: search, $options: "i" } },
        ],
      }).toArray();
      res.send(result);
    });

    // Find data with category
    app.get('/alltoys/category/:category', async (req, res) => {
      const category = req.params.category;
      const result = await toyCollection.find({ category: category }).toArray();
      res.send(result);
    });

    // Find specific item with id
    app.get('/alltoys/details/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toyCollection.findOne(query);
      res.send(result);
    });

    // add a toy route
    app.post('/all-toys', async (req, res) => {
      const body = req.body;
      body.price = parseFloat(body.price);
      const result = await toyCollection.insertOne(body);
      res.send(result);
    });

    // get the specifiq user items
    app.get('/mytoys', async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const myToy = await toyCollection.find(query).sort({ price: 1 }).toArray();
      res.send(myToy)
    });

    // to update a specifiq item
    app.patch('/updating/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedItem = req.body;
      console.log(updatedItem)
      const updateToy = {
        $set: {
          image: updatedItem.image,
          toyName: updatedItem.toyName,
          price: updatedItem.price,
          rating: updatedItem.rating,
          quantity: updatedItem.quantity
        }
      }
      const result = await toyCollection.updateOne(filter, updateToy, options);
      res.send(result);
    });
    // delete a item if user is valid
    app.delete('/alltoys/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const newToys = await toyCollection.deleteOne(query);
      res.send(newToys)
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('the server is runnin on vercel')
});

app.listen(port, (req, res) => {
  console.log('the server is running on port: ', port)
})