import {Server} from "socket.io";
import Redis from "ioredis";

const pub = new Redis({
    host:'redis-ef5c5fc-varunsh170502-34d2.a.aivencloud.com',
    port:25450,
    username:'default',
    password:'AVNS_ESxpqd8ViRNVRCh69Dt',
});
const sub = new Redis({
    host:'redis-ef5c5fc-varunsh170502-34d2.a.aivencloud.com',
    port:25450,
    username:'default',
    password:'AVNS_ESxpqd8ViRNVRCh69Dt',
});


class SocketService{
    private _io:Server;
    constructor(){
        console.log("Init socket service...")
        this._io = new Server({
            cors:{
                allowedHeaders:["*"],
                origin:"*",
            },
        });
        sub.subscribe('MESSAGES');
    }
    get io(){
        return this._io;
    }

    public initListeners(){
        const io = this._io;
        console.log("Init socket Listeners...")
        io.on('connection',(socket)=>{
            console.log("New Socket connection",socket.id);
            socket.on('event:message',async({message}:{message:string})=>{
                console.log("New Message",message);
                //publish message on redis
                await pub.publish("MESSAGES",JSON.stringify({message}));
            })
        });

       sub.on('message',(channel,message)=>{
        if(channel=== "MESSAGES"){
            io.emit("message",message);
        }
       })
    }
}

export default SocketService