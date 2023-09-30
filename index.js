const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const cors = require('cors');
const app = express();

const jwt = require('jsonwebtoken');

const port = process.env.PORT || 4000;

// midleware
app.use(cors());
app.use(express.json());


// token verifie
const verifyJWT = (req, res, next) =>{
  const authorization =req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error: true, message: 'unauthorized access'})
  }


 // bearer token
 const token = authorization.split(' ')[1];

 jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) =>{
   if(error){
     return res.status(401).send({error: true, message: 'unauthorized access'})
   }
req.decoded= decoded;
next();
 })
} 

// console.log(process.env.DB_USER);


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jo7sbx1.mongodb.net/?retryWrites=true&w=majority`;

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
    await client.connect();

    // -------Mongobd Added database---------

    const allLearningCourses = client.db('OnlineLearningPlatform').collection('course');
    const addCourseCollection = client.db("OnlineLearningPlatform").collection("addCartCourse");
    const usersCollection = client.db("OnlineLearningPlatform").collection("LearningUsers");


    // -----------jWT--------

    app.post('/jwt', (req, res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5h' })
     res.send({token})
    })


    app.get('/course', async(req, res) =>{
        const cursor = allLearningCourses.find();
        const result = await cursor.toArray();
        // console.log(result)
        res.send(result)
      })


      // user add to Cart

      app.get('/cart', verifyJWT, async(req, res) =>{
        const email = req.query.email;
        // console.log(email);
        if(!email){
         return res.send([])
        }
      
        const decodedEmail = req.decoded.email;
        if(email !== decodedEmail){
          return res.status(401).send({error: true, message: 'forbiden access'})
        }
      
        const query = {email: email}
        const result = await addCourseCollection.find(query).toArray();
        res.send(result)
      })

      app.post('/cart', async (req, res) => {
        const item = req.body;
        const result = await addCourseCollection.insertOne(item);
        res.send(result);
      })


// ----------- user releted database------

app.post('/users', async(req, res)=>{
  const user = req.body;
// console.log(user);
const quary = {email: user.email}
const existingUser = await usersCollection.findOne(quary);
// console.log(existingUser);
if(existingUser){
  return res.send({message: 'user already exists'})
}
 const result = await usersCollection.insertOne(user);
  res.send(result)
})




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res)=>{
    res.send("Onlice Learing is running");
    });

    app.listen(port, ()=>{
        console.log(`Learing api is running on port : ${port}`)
    })