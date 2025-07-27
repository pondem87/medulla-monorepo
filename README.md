### Medulla (deprecated)
(deprecated) Rewriting in Java and following a more mature development process for maintainability, reliability and improved documentation

## Description

Medulla provides access to large language models through a chat interface via whatsapp messenger. The choice of using whatsapp, is based on the target audience being learners in the developing world where access to affordable internet can be a challenge. The service makes use of whatsapp cloud api to connect users in resource limited settings to LLM services.

## Content

This NestJS monorepo contains serveral apps which are microservices that work together to provide functionality such as handling whatsapp webhook for whatsapp cloud API, managing user accounts, managing payments and usage billing, processing messages and LLM API calls, uploading and retrieving files for RAG with LLM models and administrative tasks.

It also contains deployment code including helm charts and instruction on setting up the DOKS with TLS using Nginx Ingress Controller, Cert Manager and Lets Encrypt. Also contains docker files for the microservices and GitHub actions for CICD.
