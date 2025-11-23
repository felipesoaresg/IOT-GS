/* FUNCIONALIDADES:
 * 1. Tarefas - Gerenciadas pelo Dashboard
 * 2. Lembretes - LED amarelo + buzzer
 * 3. Botão de Crise - LED vermelho + alerta
 * 4. Timer Foco - LED verde durante foco
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// === CONFIGURAÇÕES ===
const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASS = "";
const char* MQTT_BROKER = "broker.hivemq.com";
const int MQTT_PORT = 1883;

const char* TOPIC_TIMER = "focusflow/timer";
const char* TOPIC_REMINDER = "focusflow/reminder";
const char* TOPIC_CRISIS = "focusflow/crisis";
const char* TOPIC_STATUS = "focusflow/status";

#define BTN_CRISE 4
#define LED_VERDE 12    // Timer
#define LED_AMARELO 13  // Lembrete
#define LED_VERMELHO 14 // Crise
#define BUZZER 27

WiFiClient espClient;
PubSubClient mqtt(espClient);

bool timerAtivo = false;
bool emCrise = false;

void setup() {
  Serial.begin(115200);

  pinMode(BTN_CRISE, INPUT_PULLUP);
  pinMode(LED_VERDE, OUTPUT);
  pinMode(LED_AMARELO, OUTPUT);
  pinMode(LED_VERMELHO, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  
  // Conectar WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi OK!");
  
  // Conectar MQTT
  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  mqtt.setCallback(receberMensagem);
  conectarMQTT();
  
  Serial.println("Sistema pronto!");
}

void conectarMQTT() {
  while (!mqtt.connected()) {
    if (mqtt.connect("focusflow_esp32")) {
      mqtt.subscribe(TOPIC_TIMER);
      mqtt.subscribe(TOPIC_REMINDER);
      Serial.println("MQTT conectado!");
    } else {
      delay(3000);
    }
  }
}

void receberMensagem(char* topic, byte* payload, unsigned int length) {
  String msg;
  for (int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }
  
  StaticJsonDocument<200> doc;
  deserializeJson(doc, msg);
  
  String topico = String(topic);
  
  // Comando do Timer
  if (topico == TOPIC_TIMER) {
    String acao = doc["acao"];
    if (acao == "iniciar") {
      timerAtivo = true;
      digitalWrite(LED_VERDE, HIGH);
      tocarSom(1000, 200);
      Serial.println("Timer iniciado!");
    } 
    else if (acao == "parar") {
      timerAtivo = false;
      digitalWrite(LED_VERDE, LOW);
      tocarSom(500, 200);
      Serial.println("Timer parado!");
    }
    else if (acao == "fim") {
      timerAtivo = false;
      digitalWrite(LED_VERDE, LOW);
      // Alerta de fim do timer
      for (int i = 0; i < 3; i++) {
        tocarSom(1500, 300);
        delay(200);
      }
      Serial.println("Timer finalizado!");
    }
  }
  
  // Lembrete recebido
  if (topico == TOPIC_REMINDER) {
    String texto = doc["texto"];
    Serial.print("Lembrete: ");
    Serial.println(texto);
    
    // Piscar LED amarelo + som
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_AMARELO, HIGH);
      tocarSom(1200, 150);
      delay(200);
      digitalWrite(LED_AMARELO, LOW);
      delay(200);
    }
  }
}

// Verifica botão de crise
void verificarBotaoCrise() {
  if (digitalRead(BTN_CRISE) == LOW) {
    delay(50); // Debounce
    if (digitalRead(BTN_CRISE) == LOW) {
      ativarAlertaCrise();
      while (digitalRead(BTN_CRISE) == LOW); // Aguarda soltar
    }
  }
}

// Ativa alerta de crise
void ativarAlertaCrise() {
  emCrise = true;
  Serial.println("!!! ALERTA DE CRISE !!!");

  digitalWrite(LED_VERMELHO, HIGH);

  for (int i = 0; i < 5; i++) {
    tocarSom(800, 100);
    delay(100);
  }

  StaticJsonDocument<100> doc;
  doc["tipo"] = "crise";
  doc["timestamp"] = millis();
  
  String json;
  serializeJson(doc, json);
  mqtt.publish(TOPIC_CRISIS, json.c_str());
  
  delay(10000);
  digitalWrite(LED_VERMELHO, LOW);
  emCrise = false;
}

void tocarSom(int frequencia, int duracao) {
  tone(BUZZER, frequencia, duracao);
}

void loop() {
  if (!mqtt.connected()) {
    conectarMQTT();
  }
  mqtt.loop();
  
  verificarBotaoCrise();
  
  delay(100);
}