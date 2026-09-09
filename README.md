# KÖSHÏBÄR Shadowsocks

Shadowsocks + v2ray-plugin + WebSocket

Prévu pour Google Cloud Run.

## Configuration

Password:

KOSHIBAR

Encryption:

chacha20-ietf-poly1305

WebSocket path:

/Koshibar/Shadowsocks

Transport:

WebSocket

Container port:

8080

## Architecture

Client
  |
  | WSS
  v
Google Cloud Run
  |
  | WebSocket interne
  v
Shadowsocks
  |
  +-- v2ray-plugin
  |
  +-- /Koshibar/Shadowsocks

## Déploiement Cloud Run

Créer le service depuis ce dépôt GitHub.

Région :

europe-west1

Port du conteneur :

8080

Authentification :

Allow unauthenticated

Le conteneur utilise automatiquement :

PORT

Cloud Run fournit normalement 8080.

## Variables d'environnement

KOSHIBAR_PASSWORD

Valeur par défaut :

KOSHIBAR

Pour une utilisation réelle, il est recommandé
de placer le mot de passe dans Secret Manager
plutôt que directement dans GitHub.

## URL

Après le déploiement, Cloud Run fournit une URL du type :

https://SERVICE-xxxxx.europe-west1.run.app

Le WebSocket externe utilise :

wss://SERVICE-xxxxx.europe-west1.run.app/Koshibar/Shadowsocks

## Client Shadowsocks

Serveur :

SERVICE-xxxxx.europe-west1.run.app

Port :

443

Password :

KOSHIBAR

Encryption :

chacha20-ietf-poly1305

Plugin :

v2ray

Transport :

websocket-tls

Host :

SERVICE-xxxxx.europe-west1.run.app

Path :

/Koshibar/Shadowsocks

Concurrent connections :

0

## Important

Le TLS est terminé par Google Cloud Run.

Le conteneur reçoit donc un WebSocket
interne non-TLS.

Ne pas ajouter :

tls

dans plugin_opts côté serveur Cloud Run.

## Test HTTP

La racine :

/

peut répondre différemment selon le service.
Le test important est la connexion WebSocket.

## Limitations Cloud Run

Cloud Run n'est pas une VM.

Le service est adapté au trafic TCP transporté
à l'intérieur d'un WebSocket.

UDP n'est pas utilisé ici.

Les connexions WebSocket sont soumises au
timeout Cloud Run et les clients doivent pouvoir
se reconnecter.

## Build Docker

docker build -t koshibar-shadowsocks .

## Test local

docker run \
  -p 8080:8080 \
  -e KOSHIBAR_PASSWORD=KOSHIBAR \
  koshibar-shadowsocks
