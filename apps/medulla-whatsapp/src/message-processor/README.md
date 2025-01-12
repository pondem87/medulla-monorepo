# Message Processor

This module receives messages from the whatsapp module. After whatsapp module receives the whatsapp webhook notification of type "messages", it sends the message to this module.

## Message Process Controller
This module receives the message from the whtasapp queue (rabbitmq). The message process controller (message-process.controller.ts) takes in message from the queue with pattern "MESSAGE_TO_PROCESS" and passes the payload to the processMessage function of message process service (message-process.service.ts).

## Message Process Service
Message process service through the function processMessage uses a state machine actor to go through a series of events which parse the message and perform actions such as passing on the message to the Medulla-AI module for further processing or WhatsApp Messenger module through rabbitmq. This state machine is called the MessageProcessingStateMachine.

## Message Processing State Machine and Interactive State Machine
MessageProcessingStateMachine utilises a InteractiveStateMachine which is a persisted state machine which contains the current state of the conversation with the user. The database persisted context of the InteractiveStateMachine allows maintance of state from message to message. It contains information on how to retrieve chathistory and makes menu navigation possible.

After retrieving the persisted state from the database, the MessageProcessingState machine actor sends the "execute" event to the InteractiveStateMachine to perform the relevant actions on the received message based on the current state of the InteractiveStateMachine. Each state of the InteractiveStateMachine has its own service which implements functions to be invoked by the state machine when the "execute" event is sent to the respective state.

# State "execute"
The states of the Interactive state machine contain a nested state machine with states "ready", "executing" and "executed". The initial state is the ready state. When "execute" event is sent, the machine goes to "executing" where a child state machine actor is envoked and passed the function from the state service which performs the specific functions of the state. This allows easy plugging in of new states and their fuctions without using confusing and long "if else if" or "switch" statements to determine how to process messages. Each  states actions are always triggered by sending the same "execute" event which then behaves differently depending on the current state of the state machine.


In the MessageProcessingStateMachine we retrieve the persisted snapshot of the InteractiveStateMachine and save the final state after perfoming the required actions. In the middle we perform state specific actions using the state specific services in the machine-states folder.

# RabbitMQ queues
To send a message to the user we use the whatsappRmqClient which sends the message to the whatsapp messenger module. To send message to the medulla AI module we use the llmRmqClient via the llm-queue.service.ts.