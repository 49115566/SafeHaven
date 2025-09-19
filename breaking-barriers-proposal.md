**Project Proposal: SafeHaven Connect**

Team name: SaveHaven  
Team Members: Ryan Chui, Craig Truitt, Muxin Ge, Rashedul Islam Seum

## **A Real-Time Shelter & Responder Communication Platform for FirstNet**

### **1\. The Problem**

During a disaster, a critical gap exists in communication between first responders and community shelters. First responders often lack real-time information on a shelter's capacity, resources, and current needs, leading to inefficient resource allocation and potential safety risks for evacuees. Existing communication methods on commercial networks are unreliable during large-scale emergencies.

### **2\. The Solution: SafeHaven Connect**

We propose **SafeHaven Connect**, a two-part application that closes this gap using the dedicated, reliable FirstNet public safety network and the scalable services of AWS.

* **Shelter Command App (for Operators):** A simple, intuitive mobile app for shelter personnel to send real-time status updates on capacity, available resources, and urgent needs with just a few taps.  
* **Responder Dashboard App (for First Responders):** A live, map-based app for first responders that displays color-coded pins showing the real-time status of all registered shelters. It enables them to visualize shelter status, filter based on specific needs, and receive critical alerts for urgent changes.

### **3\. Technical Architecture & Implementation**

The platform will use a serverless architecture on AWS for scalability and reliability.

* **Real-Time Communication:** We will use **Amazon SNS** and **Amazon SQS** to create a publish/subscribe model, ensuring instant delivery of updates from shelters to all relevant responders.  
* **Data Storage & Logic:** We will store data in **Amazon DynamoDB** for fast access and use **AWS Lambda** functions to handle all backend processing.  
* **FirstNet Integration:** The entire system will operate on the FirstNet network, leveraging its priority and preemption capabilities to guarantee communication is unaffected by network congestion.

### **4\. Impact & Future Potential**

**SafeHaven Connect** will significantly improve community safety by enabling a new level of coordination between community volunteers and emergency services. This platform will help save lives and resources by providing first responders with actionable data. Future versions could integrate additional data sources like real-time weather and fire-line information or incorporate IoT sensors within shelters for automated reporting.