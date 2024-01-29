import { Kafka,Producer } from "kafkajs";
import fs from "fs";
import path from "path";
import prismaClient from "./prisma";

const kafka = new Kafka({
    brokers:['kafka-392d8f10-varunsharmabro-74b4.a.aivencloud.com:20944'],
    ssl:{
        ca:[fs.readFileSync(path.resolve('./ca.pem'), 'utf8')],
    },
    sasl:{
        username:"avnadmin",
        password:"AVNS_u2IWHOvGi7Q3RaSuevA",
        mechanism:"plain",
    },
});

let producer:null | Producer = null;

export async function createProducer(){
    if(producer) return producer;
    const _producer = kafka.producer();
    await _producer.connect();
    producer = _producer
    return producer;
}

export async function produceMessage(message:string){
    const producer = await createProducer();
    producer.send({
        messages:[{key:`message-${Date.now()}`, value:message}],
        topic:"MESSAGES",
    });
    return true;
}


export async function startMessageConsumer(){
    console.log("Consume is running");
    const consumer=kafka.consumer({groupId:"default"});
    await consumer.connect();
    await consumer.subscribe({topic:"MESSAGES",fromBeginning:true});
    await consumer.run({
        autoCommit:true,
        eachMessage: async({message,pause}) => {
            if(!message.value){
                return;
            }
            console.log(`new message received`);
            try {
                await prismaClient.message.create({
                    data:{
                        text:message.value?.toString(),
                    },
                })
            } catch (error) { 
                //If db is down temporarily then pause dumping to db for 60sec and then resume dumping data into db again...
                console.log("SOMETHING IS WRONG");
                pause();
                setTimeout(()=>{consumer.resume([{topic:'MESSAGES'}])},60*1000)
            }
            
        }
    })


}


export default kafka;