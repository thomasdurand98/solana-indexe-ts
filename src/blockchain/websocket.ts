import { Connection, SlotUpdate } from "@solana/web3.js";
import WebSocket from "ws";
import { SolanaConfig, WebSocketMessage } from "../types";
import { TransactionFetcher } from "./transactionFetcher";
import { BlockFetcher } from "./blockFetcher";

export class SolanaWebSocketClient {
    private ws: WebSocket
    private connection: Connection
    private subscriptionId?: number
    private blockFetcher: BlockFetcher
    
    constructor(private config: SolanaConfig) {
        this.connection = new Connection(config.rpcEndpoint)
        this.blockFetcher = new BlockFetcher(this.connection)
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
        await this.blockFetcher.fetchBlock(slotUpdate.slot)
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