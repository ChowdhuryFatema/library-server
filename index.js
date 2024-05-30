const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://library-2dd53.web.app',
    'https://library-2dd53.firebaseapp.com',
  ],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zxai2xc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// middleware 
const logger = (req, res, next) => {
  console.log('log: info', req.method, req.url);
  next()
}


const verifyToken = (req, res, next) => {

  const token = req?.cookies?.token;
  console.log('token in the middleware', token);

  // no token available 
  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' })
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.user = decoded;
    next()
  })

}

const cookeOption = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production' ? true : false,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const booksCollection = client.db("libraryDB").collection("books");
    const borrowedBooksCollection = client.db("libraryDB").collection("borrowedBooks");


    // auth related api 

    app.post('/jwt', async (req, res) => {
      const user = req.body;
      console.log(user)

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '365d' })

      res.cookie('token', token, cookeOption)
        .send({ success: true })

    })

    app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log('log out', user);
      res.clearCookie('token', { maxAge: 0 }).send({ success: true })
    })

    // book related api


    app.get('/books', logger, verifyToken, async (req, res) => {

      if (req.user?.email !== req.query.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }

      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }

      const filter = req.query;

      const queryTitle = {
        name: {$regex: filter.search, $options: 'i'}
      } 

      const cursor = await booksCollection.find(queryTitle).toArray();
      res.send(cursor);
    })
    

    app.get('/booksCat', async (req, res) => {

      const result = await booksCollection.find().toArray();
      res.send(result)
    })



    app.get('/book/:category', async (req, res) => {
      const cat = req.params.category;
      console.log(cat);


      const query = { category: cat }
      const result = await booksCollection.find(query).toArray();
      res.send(result)
    })


    app.get('/books/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await booksCollection.findOne(query);
      res.send(result)
    })

    app.post('/books', verifyToken, async (req, res) => {
      const result = await booksCollection.insertOne(req.body);
      res.send(result);
    })

    app.put('/books/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
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


    // borrowed Book 

    app.get('/borrowedBooks', async (req, res) => {
      const result = await borrowedBooksCollection.find().toArray();
      res.send(result)
    })


    app.post('/borrowedBooks', async (req, res) => {
      console.log(req.body);
      const result = await borrowedBooksCollection.insertOne(req.body);

      res.send(result);


    })

    app.delete('/borrowedBooks/:id', async (req, res) => {

      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await borrowedBooksCollection.deleteOne(query);
      res.send(result)


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