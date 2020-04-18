/*
  Dweet.io GET client for ArduinoHttpClient library
  Connects to dweet.io once every ten seconds,
  sends a GET request and a request body. Uses SSL

  Shows how to use Strings to assemble path and parse content
  from response. dweet.io expects:
  https://dweet.io/get/latest/dweet/for/thingName

  For more on dweet.io, see https://dweet.io/play/

  created 15 Feb 2016
  updated 22 Jan 2019
  by Tom Igoe

  this example is in the public domain
*/
#include <ArduinoHttpClient.h>
#include <ESP8266WiFi.h>
#include <ArduinoJson.h>
#include <Servo.h>

// Network settings
const char ssid[] = "Redmi";
const char pass[] = "12345678";

const int trigPin = D3;
const int echoPin = D4;
const int red= D5;
const int green= D6;

const char serverAddress[] = "dweet.io";  // server address
int port = 80;
String authID= "5e99b34694e35f090c2baacb";
0
Servo myservo;  // create servo object to control a servo
WiFiClient wifi;
HttpClient client1 = HttpClient(wifi, serverAddress, port);
HttpClient client2 = HttpClient(wifi, serverAddress, port);
//StaticJsonBuffer<200> jsonBuffer;

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, pass);
    while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected");
  pinMode(red, OUTPUT);
  pinMode(green, OUTPUT);
  pinMode(trigPin, OUTPUT);  // Sets the trigPin as an Output
  pinMode(echoPin, INPUT);  // Sets the echoPin as an Input
  myservo.attach(D8);  // attaches the servo on D8 to the servo object

}

void loop() {

  // assemble the path for the GET message:
  String path1 = "/get/latest/dweet/for/"+authID+"_nodemcu_static";  // CHECKING LATEST DWEET

  // send the GET request
  Serial.println("making GET request to fetch data");
  client1.get(path1);

  // read the status code and body of the response
  int statusCode1 = client1.responseStatusCode();
  String response = client1.responseBody();
  //Serial.print("Status code: ");
  //Serial.println(statusCode);
  //Serial.print("Response: ");
  //Serial.println(response);

  /*
    Typical response is:
    {"this":"succeeded",
    "by":"getting",
    "the":"dweets",
    "with":[{"thing":"my-thing-name",
      "created":"2016-02-16T05:10:36.589Z",
      "content":{"sensorValue":456}}]}

    You want "content": numberValue
  */
  // now parse the response looking for "content":
  int labelStart = response.indexOf("content\":");
  // find the first { after "content":
  int contentStart = response.indexOf("{", labelStart);
  // find the following } and get what's between the braces:
  int contentEnd = response.indexOf("}", labelStart);
  String content = response.substring(contentStart + 1, contentEnd);
  //Serial.println(content);
  //JsonObject& root = jsonBuffer.parseObject(json);
  
  // now get the value after the colon, and convert to an int:
  int valueStart = content.indexOf(":");
  String key=  content.substring(1,valueStart-1);    //redled or greenled or slider
  String valueStr = content.substring(valueStart + 1);
  int value = valueStr.toInt();                   //value
  
  Serial.println(key+" , "+value);
if(key=="redled"){
    if(value==1)
      digitalWrite(red,HIGH);
    else
      digitalWrite(red,LOW);
}
else if(key=="greenled"){
  if(value==1)
    digitalWrite(green,HIGH);
  else
    digitalWrite(green,LOW);
}
else if(key=="slider"){
  myservo.write(value);              // tell servo to go to position in variable 'pos'
}

// Test if parsing succeeds.
//  if (!root.success()) {
//    Serial.println("parseObject() failed");
//    return;
//  }

  //int servo= root["servo"];
  //int redled=root["redled"];
  //int greenled= root["greenled"];
  

  int ldr=analogRead(A0);
  int dist = triggerRadar(trigPin,echoPin);
  String path2 = "/dweet/for/"+authID+"_nodemcu_dynamic?ldr=" + String(ldr)+"&dist="+String(dist);

  // send the GET request
  Serial.println("making another GET request to post data");
  client2.get(path2);

  // read the status code and body of the response
//  int statusCode2 = client2.responseStatusCode();
//  Serial.print("Status code: ");
//  Serial.println(statusCode2);
  String response2 = client2.responseBody();
  Serial.print("Response: ");
  Serial.println(response2);
  
  Serial.println("LDR: "+String(ldr)+" DIST: "+String(dist));

  Serial.println("Wait 5 seconds\n");
  delay(5000); 
}
int triggerRadar(int trigPin, int echoPin){
  String dist;
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH);
  int d = duration*0.0343/2;
  return d;
}
