//importing
import express from "express";
import mongoose from "mongoose";
import Messages from './dbMessages.js';
import Pusher from "pusher";
import cors from "cors";
//app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1280305",
    key: "cb7aba5b078c58589e1c",
    secret: "96d423053c789e7d8ae8",
    cluster: "ap2",
    useTLS: true
  });
  

//middlewares
app.use(express.json());

/*app.use((req,res,next)=>{
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Headers","*");
    next();
})*/

app.use(cors());
//DB Config
const connection_url = "mongodb+srv://admin:3ow0LE6HYqSAZ17H@cluster0.0irpx.mongodb.net/whatsappdb?retryWrites=true&w=majority";
mongoose.connect(connection_url,{
  //  useCreateIndex: true,
  //  useNewUrlParser: true,
    useUnifiedTopology: true,
},err => {
    if(err) throw err;
    console.log('Connected to MongoDB!!!')
})

const db = mongoose.connection

db.once('open',()=>{
    console.log('db is connected');

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change",(change) => {
        console.log(change);

        if (change.operationType === "insert"){
            const messageDetails = change.fullDocument;
            pusher.trigger("messages","inserted",
                {
                    name : messageDetails.name,
                    message: messageDetails.message,
                    timeStamp: messageDetails.timeStamp,
                    received: messageDetails.received,
                }
            );
        }else{
            console.log("Error triggering pusher");
        }
    });

   
})


//api routes
app.get("/",(req,res)=>res.status(200).send("hello world"));

app.get("/messages/sync", (req,res) => {
    Messages.find((err,data) => {
        if(err){
            res.status(500).send(err)
        }else{
            res.status(200).send(data)
        }
    })
})
app.post("/messages/new", (req,res) => {
    const dbMessage = req.body

    Messages.create(dbMessage, (err,data) => {
        if(err){
            res.status(500).send(err)
        }else{
            res.status(201).send(data)
        }
    })
})

//listen
app.listen(port,()=>console.log(`Listening on localhost:${port}`));


// 3ow0LE6HYqSAZ17H