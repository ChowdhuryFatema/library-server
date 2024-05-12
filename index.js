const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const app = express();
const port = process.env.PORT || 5000; 

// middleware
app.use(express.json());
app.use(cors());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zxai2xc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const booksCollection = client.db("libraryDB").collection("books");

    app.get('/books', async(req, res) => {
        const result = await booksCollection.find().toArray();
        res.send(result) 
    })
    app.get('/book/:category', async(req, res) => {
      const cat = req.params.category;
      console.log(cat);


      const query = { category: cat}
      const result = await booksCollection.find(query).toArray();
      res.send(result)
    })


    app.get('/books/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await booksCollection.findOne(query);
      res.send(result)
    })

    app.post('/books', async(req, res) => {
        console.log(req.body);
        const result = await booksCollection.insertOne(req.body);
        res.send(result);
    })


    app.put ( '/books/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const options = { upsert: true };
      const updatedDetails = req.body;

      
   const books = {
        $set: {
          image: updatedDetails.image,
          name: updatedDetails.name, 
          author: updatedDetails.author, 
          category: updatedDetails.category, 
          rating: updatedDetails.rating, 
      },
    };

       
      const result = await booksCollection.updateOne(filter, books, options);
      res.send(result);

    })



    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("The server is running")
})

app.listen(port, () => {
    console.log(`The server is running on port ${port}`)
})