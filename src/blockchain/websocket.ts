import { Connection, SlotUpdate } from "@solana/web3.js";
import WebSocket from "ws";
import { SolanaConfig, WebSocketMessage } from "../types";
import { TransactionFetcher } from "./transactionFetcher";

export class SolanaWebSocketClient {
    private ws: WebSocket
    private connection: Connection
    private subscriptionId?: number
    private transactionFetcher: TransactionFetcher
    
    constructor(private config: SolanaConfig) {
        this.connection = new Connection(config.rpcEndpoint)
        this.transactionFetcher = new TransactionFetcher(this.connection)
        this.ws = new WebSocket(config.wsEndpoint, {
            rejectUnauthorized: false
        })
        this.setupWebSocket()
    }

    private setupWebSocket() {
        this.ws.on('open', () => {
            console.log("WebSocket connected")
            this.subscribeToSlots()
        })

        this.ws.on('message', (data: Buffer) => {
            try {
                const message: WebSocketMessage = JSON.parse(data.toString())
                this.handleMessage(message)
            } catch(error) {
                console.error("Error parsing message:", error)
            }
        })

        this.ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });

        this.ws.on('close', () => {
            console.log('WebSocket disconnected');
        });
    }

    private subscribeToSlots() {
        const subscribeMessage = {
            jsonrpc: '2.0',
            id: 1,
            method: 'slotSubscribe',
        };

        this.ws.send(JSON.stringify(subscribeMessage));
    }

    private async handleMessage(message: WebSocketMessage) {
        if (message.result !== undefined) {
            this.subscriptionId = message.result;
            console.log('Subscribed to slots with id:', this.subscriptionId);
            return;
        }

        // Handle slot updates
        if (message.params?.result) {
            const slotUpdate: SlotUpdate = message.params.result;
            await this.handleSlotUpdate(slotUpdate);
        }
    }

    private async handleSlotUpdate(slotUpdate: SlotUpdate) {
        console.log('New slot:', slotUpdate.slot);
        // Here we'll add logic to fetch and process transactions
        // This is where we'll integrate with other components
    }

    public close() {
        if (this.subscriptionId) {
            const unsubscribeMessage = {
                jsonrpc: '2.0',
                id: 2,
                method: 'slotUnsubscribe',
                params: [this.subscriptionId],
            };
            this.ws.send(JSON.stringify(unsubscribeMessage));
        }
        this.ws.close();
    }
}