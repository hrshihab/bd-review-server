const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000 ;

const app = express();
app.use(cors())
app.use(express.json())

app.get('/',(req,res)=> {
  res.send('Server Running !!')

})
  

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wwvmwag.mongodb.net/?retryWrites=true&w=majority`;

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
        const database = client.db('bdreview');
        const kucollection = database.collection('kudata');
        const kuReviewsCollection = database.collection('kuReviews');

        function verifyJwt (req,res,next) {
          const authHeaders = req.headers.authorization;
          if(!authHeaders){
            return res.status(401).send({message:'unauthorize access'})
          }
          const token = authHeaders.split(' ')[1];
          jwt.verify(token,process.env.ACCESS_SECRET_TOKEN,function(err,decoded){
            if(err){
              return res.status(403).send({message:'Forbidden access'});
             
            }
            req.decoded = decoded;
            next();
          })
        }
        app.get('/allcategory',async(req,res)=> {
          const query = {};
          const cursor = kucollection.find(query);
          const result = await cursor.toArray();
          res.send(result);
        })
        app.get('/reviewItems/:categoryName',async(req,res)=> {
          const categoryName = req.params.categoryName;
          const query = {type:categoryName}
          //console.log(categoryName);
          const items = await kucollection.findOne(query);
          res.send(items);
        })
        app.get('/reviewItems/:type/:id',async(req,res)=> {
          const type = req.params.type;
          const id = req.params.id;
          const query = {type:type}
          const options = {
            // sort matched documents in descending order by rating
            
            // Include only the `title` and `imdb` fields in the returned document
            projection: { _id: 0, [type]:1,type:1 },

          };
          const items = await kucollection.findOne(query,options);
          //const data = items[type].find(itm=>itm[id]===id);
          //console.log(typeof(id));
          res.send({items,keys:id});
        })

        app.post('/reviewItems/:id',async(req,res)=> {
          const id = req.params.id;
          const data = req.body;
          console.log(data);
          const result = await kuReviewsCollection.insertOne(data)
          //console.log(id,data);
          console.log(`A document was inserted with the _id: ${result.insertedId}`);
          res.send(result);
          

        })
        app.get('/reviews/:id',verifyJwt,async(req,res)=> {
          const decoded = req.decoded;
          if(decoded.email !== req.query.email){
            res.status(403).send({message:'unauthorized access'})
          }
          const id = req.params.id;
          const query = {id:id}
          const cursor =  kuReviewsCollection.find(query);
          const result = await cursor.toArray();
          res.send(result);

        })
        app.delete('/reviews/:id',async(req,res)=> {
          const id = req.params.id;
          const query = {_id:new ObjectId(id)};
          const result = await kuReviewsCollection.deleteOne(query);
          if (result.deletedCount === 1) {
            console.log("Successfully deleted one document.");
          } else {
            console.log("No documents matched the query. Deleted 0 documents.");
          }
          res.send(result);
        })

        app.post('/jwt',async(req,res)=> {
          const user = req.body;
          const token = jwt.sign(user,process.env.ACCESS_SECRET_TOKEN,{expiresIn:'30d'})
         res.send({token})
        })
        
        
        
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);


app.listen(port,()=> {
  console.log('Port Running on ',port);
})