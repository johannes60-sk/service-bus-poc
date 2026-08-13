# Azure Service Bus POC

# Scénario 1 — Fonctionnement normal

Consommateur :

```bash
npx tsx src/consumer-processor.ts
```

Producteur :

```bash
npx tsx src/producer.ts --messageCount=100 --messagesPerSecond=10
```

---

# Scénario 2 — Burst

Consommateur :

```bash
npx tsx src/consumer-processor.ts
```

Producteur :

```bash
npx tsx src/producer.ts --messageCount=1000 --messagesPerSecond=100
```

---

# Scénario 3 — Traitement parallèle

Consommateur :

```bash
npx tsx src/consumer-processor.ts
```

Configurer :

```ts
maxConcurrentCalls: 5
```

Puis envoyer des messages avec le producteur.

---

# Scénario 4 — Erreurs et nouvelles tentatives

Consommateur :

```bash
npx tsx src/consumer-processor.ts --failureRate=20
```

Producteur :

```bash
npx tsx src/producer.ts --messageCount=100 --messagesPerSecond=10
```

---

# Scénario 5 — Dead-Letter Queue

Configurer la queue Azure :

```
Max Delivery Count = 5
```

Consommateur :

```bash
npx tsx src/consumer-processor.ts --failureRate=100
```

Producteur :

```bash
npx tsx src/producer.ts --messageCount=1
```

Vérifier ensuite que le message apparaît dans la **Dead-Letter Queue**.

---

# Scénario 6 — Arrêt brutal du consommateur

Remplacer temporairement :

```ts
 await sleep(Number(args.processingTimeMs ?? 100));
```

par :

```ts
await sleep(30000);
```

Démarrer le consommateur, envoyer un message puis interrompre le programme (`Ctrl + C`) avant la fin du traitement.

Redémarrer ensuite le consommateur pour constater que le message est retraité (voir sur azure).

---

# Scénario 7 — Expiration du lock

Configurer :

```
Lock Duration = 30 secondes
```

Puis :

```ts
await sleep(35000);
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