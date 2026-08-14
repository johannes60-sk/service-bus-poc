# Azure Service Bus POC

# Scénario 1 — Fonctionnement normal

Consommateur :

```bash
npm run consumer:processor
```

Producteur :

```bash
npm run producer -- --messageCount=100 --messagesPerSecond=10
```

---

# Scénario 2 — Burst

Consommateur :

```bash
npm run consumer:processor
```

Producteur :

```bash
npm run producer -- --messageCount=1000 --messagesPerSecond=100
```

---

# Scénario 3 — Traitement parallèle

Consommateur avec 5 traitements en parallèle :

```bash
npm run consumer:processor -- --maxConcurrentCalls=5
```

Puis envoyer des messages avec le producteur :

```bash
npm run producer -- --messageCount=100 --messagesPerSecond=10
```

---

# Scénario 4 — Erreurs et nouvelles tentatives

Consommateur :

```bash
npm run consumer:processor -- --failureRate=20
```

Producteur :

```bash
npm run producer -- --messageCount=100 --messagesPerSecond=10
```

---

# Scénario 5 — Dead-Letter Queue

Configurer la queue Azure :

```text
Max Delivery Count = 5
```

Consommateur :

```bash
npm run consumer:processor -- --failureRate=100
```

Producteur :

```bash
npm run producer -- --messageCount=1
```

Vérifier ensuite que le message apparaît dans la **Dead-Letter Queue**.

---

# Scénario 6 — Arrêt brutal du consommateur

Démarrer le consommateur avec un traitement long :

```bash
npm run consumer:processor -- --processingTimeMs=30000
```

Envoyer un message :

```bash
npm run producer -- --messageCount=1
```

Interrompre le consommateur (`Ctrl + C`) avant la fin du traitement.

Redémarrer ensuite le consommateur pour constater que le message est retraité (voir sur Azure).

---

# Scénario 7 — Expiration du lock

Configurer :

```text
Lock Duration = 30 secondes
```

Démarrer le consommateur avec un traitement plus long que la durée du lock :

```bash
npm run consumer:processor -- --processingTimeMs=35000
```

Envoyer un message :

```bash
npm run producer -- --messageCount=1
```

Le traitement dépasse la durée du lock et le message est redistribué automatiquement.

---

# Exemples de logs

```text
Message 42 reçu
Temps passé dans la queue : 820 ms
Tentative : 2
Traitement terminé en 103 ms
✅ Message validé
```

```text
❌ Erreur simulée (tentative 4)
```

```text
========== État du test ==========
Messages reçus        : 125
Messages validés      : 100
Messages abandonnés   : 25
Temps moyen en queue  : 6650 ms
Temps moyen traitement: 106 ms
Débit du consommateur : 2.30 msg/s
==================================
```

---

# Comportements observés

- Le débit d'envoi et le temps de traitement sont configurables.
- Les messages sont retraités après un abandon et `deliveryCount` augmente.
- Les messages sont automatiquement déplacés vers la Dead-Letter Queue après le nombre maximal de tentatives.
- Un message n'est pas perdu lorsqu'un consommateur s'arrête brutalement.
- Si le traitement dépasse la durée du lock, le message est redistribué.
