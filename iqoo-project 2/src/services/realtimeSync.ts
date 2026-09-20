import mqtt, { MqttClient } from 'mqtt';
import { CrashReport } from '../types/reprox';

// Generate a random 6-character uppercase alphanumeric code
function generateShortCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

class RealtimeSyncService {
  private client: MqttClient | null = null;
  private serverUrl = 'wss://broker.emqx.io:8084/mqtt'; 
  private currentShortCode: string | null = null;
  private isDashboard = false;

  // Callbacks
  private onDeviceDetectedCb: (() => void) | null = null;
  private onPairingSuccessCb: ((deviceInfo: any) => void) | null = null;
  private onCrashReceivedCb: ((crash: CrashReport) => void) | null = null;

  private onSessionValidCb: (() => void) | null = null;
  private onSessionInvalidCb: ((reason: string) => void) | null = null;
  private onDashboardDisconnectedCb: (() => void) | null = null;

  public connect(onConnect?: () => void) {
    if (!this.client) {
      this.client = mqtt.connect(this.serverUrl);

      this.client.on('connect', () => {
        console.log('[Realtime] Connected to public MQTT broker');
        if (onConnect) onConnect();
      });

      this.client.on('offline', () => {
        console.log('[Realtime] Offline from sync server');
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message.toString());
      });
    } else if (this.client && onConnect) {
      if (this.client.connected) {
        onConnect();
      } else {
        this.client.once('connect', () => {
          onConnect();
        });
      }
    }
    return this.client;
  }

  private handleMessage(topic: string, payload: string) {
    if (!this.currentShortCode) return;
    
    let data;
    try {
      data = JSON.parse(payload);
    } catch (e) {
      return;
    }

    const { type, payload: msgPayload } = data;

    if (this.isDashboard && topic === `reprox/session/${this.currentShortCode}/mobile_to_dash`) {
      switch (type) {
        case 'check_session':
          // Mobile is checking if session exists. Since dashboard is listening, it exists!
          if (this.onDeviceDetectedCb) this.onDeviceDetectedCb();
          this.publishToMobile('session_valid', {});
          break;
        case 'approve_connection':
          if (this.onPairingSuccessCb) this.onPairingSuccessCb(msgPayload.deviceInfo);
          break;
        case 'send_crash':
          if (this.onCrashReceivedCb) this.onCrashReceivedCb(msgPayload.crash);
          break;
      }
    } else if (!this.isDashboard && topic === `reprox/session/${this.currentShortCode}/dash_to_mobile`) {
      switch (type) {
        case 'session_valid':
          if (this.onSessionValidCb) this.onSessionValidCb();
          break;
        case 'session_invalid':
          if (this.onSessionInvalidCb) this.onSessionInvalidCb(msgPayload.reason);
          break;
        case 'dashboard_disconnected':
          if (this.onDashboardDisconnectedCb) this.onDashboardDisconnectedCb();
          break;
      }
    }
  }

  private publishToMobile(type: string, payload: any) {
    if (this.client && this.currentShortCode) {
      this.client.publish(`reprox/session/${this.currentShortCode}/dash_to_mobile`, JSON.stringify({ type, payload }));
    }
  }

  private publishToDashboard(type: string, payload: any) {
    if (this.client && this.currentShortCode) {
      this.client.publish(`reprox/session/${this.currentShortCode}/mobile_to_dash`, JSON.stringify({ type, payload }));
    }
  }

  public disconnect() {
    if (this.client) {
      if (this.isDashboard) {
        this.publishToMobile('dashboard_disconnected', {});
      }
      this.client.end();
      this.client = null;
      this.currentShortCode = null;
    }
  }

  // ---- DASHBOARD METHODS ----

  public createPairingSession(onSessionCreated: (shortCode: string) => void) {
    this.isDashboard = true;
    this.currentShortCode = generateShortCode();
    
    this.connect(() => {
      // Subscribe to mobile messages
      this.client?.subscribe(`reprox/session/${this.currentShortCode}/mobile_to_dash`, (err) => {
        if (!err) {
          onSessionCreated(this.currentShortCode!);
        } else {
          console.error("Failed to subscribe to topic", err);
        }
      });
    });
  }

  public onDeviceDetected(callback: () => void) {
    this.onDeviceDetectedCb = callback;
  }

  public onPairingSuccess(callback: (deviceInfo: any) => void) {
    this.onPairingSuccessCb = callback;
  }

  public onMobileDisconnected(_callback: () => void) {
    // Optional: implement if mobile sends a disconnect message
  }

  public onCrashReceived(callback: (crash: CrashReport) => void) {
    this.onCrashReceivedCb = callback;
  }

  public disconnectMobile() {
    // We could publish a message to disconnect mobile, but MQTT doesn't inherently need it
    // if we just ignore them.
  }

  // ---- MOBILE METHODS ----

  public checkSession(shortCode: string, onValid: () => void, onInvalid: (reason: string) => void) {
    this.isDashboard = false;
    this.currentShortCode = shortCode;
    this.onSessionValidCb = onValid;
    this.onSessionInvalidCb = onInvalid;

    this.connect(() => {
      // Subscribe to dashboard messages
      this.client?.subscribe(`reprox/session/${this.currentShortCode}/dash_to_mobile`, (err) => {
        if (!err) {
          // Tell dashboard we are checking session
          this.publishToDashboard('check_session', {});
          
          // Let the UI handle the timeout if 'session_valid' is not received.
          // Wait, actually we can handle it here:
          const timeoutId = setTimeout(() => {
            if (this.onSessionInvalidCb) {
              this.onSessionInvalidCb('not_found');
            }
          }, 5000);
          
          // Clear timeout if valid
          const originalValid = this.onSessionValidCb;
          this.onSessionValidCb = () => {
            clearTimeout(timeoutId);
            if (originalValid) originalValid();
          };
        }
      });
    });
  }

  public approveConnection(shortCode: string, deviceInfo: any) {
    this.currentShortCode = shortCode;
    this.publishToDashboard('approve_connection', { deviceInfo });
  }

  public sendCrash(crash: CrashReport) {
    this.publishToDashboard('send_crash', { crash });
  }

  public onDashboardDisconnected(callback: () => void) {
    this.onDashboardDisconnectedCb = callback;
  }
}

export const realtimeSync = new RealtimeSyncService();
