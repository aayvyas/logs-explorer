# Logs Explorer: High-Performance Log Analytics Engine

An engineered-to-scale, local-first log management platform inspired by the observability stacks at Google (Cloud Logging) and Meta. This project focuses on high-throughput ingestion, zero-overhead storage, and $O(1)$ retrieval patterns for multi-gigabyte log datasets.

## 🏗 System Architecture

The system is partitioned into two core layers to decouple data ingestion from query resolution:

1.  **Ingestion & Normalization Layer**: Handles event-driven parsing and recursive schema flattening.
2.  **Storage & Indexing Engine (`LogSegment`)**: Manages byte-addressed storage and inverted indexing for logarithmic search complexity.

---

## 💾 Storage Engine: `LogSegment` Implementation

The core of the system is the `LogSegment`, which implements a **segment-based storage architecture** designed for low memory footprint and high spatial locality.

### 1. Byte-Addressed Random Access
Rather than loading data into JVM heap, `LogSegment` treats log files as memory-mapped-like structures using `RandomAccessFile`. 
- **Mechanism**: Each log entry is stored raw on disk. During ingestion, the engine records the precise **byte offset** and length of the entry.
- **Access Pattern**: Retrieval is performed via `seek(offset)` operations, enabling constant time $O(1)$ access to any entry regardless of file size.

### 2. Universal Inverted Indexing
The system maintains a multi-dimensional inverted index in-memory:
```java
Map<String, Map<String, List<Long>>> universalIndex;
// fieldName -> { fieldValue -> [offset1, offset2, ...] }
```
- **Structure**: Each distinct field value points to a list of byte offsets where it occurs.
- **Optimization**: This avoids full-table scans, reducing search time to $O(k \log n)$ where $k$ is the number of filters.

### 3. Boolean Query Resolution (Set Intersection)
Multi-filter queries are resolved using an optimized intersection algorithm:
- Filters are applied sequentially.
- The engine uses `retainAll` on offset lists to perform **Boolean AND** operations.
- This results in a minimal set of offsets that are only then hydrated from disk, minimizing I/O overhead.

---

## ⚙️ Ingestion Pipeline: `LogService`

The `LogService` manages the lifecycle of segments and coordinates the streaming ingestion process.

### 1. Event-Driven Streaming Parser
Uses the **Jackson Streaming API (`JsonParser`)** to iterate over logs as a stream of tokens. 
- **Efficiency**: Unlike DOM-based parsing (`ObjectMapper.readTree`), this approach maintains a constant memory overhead (approx. $O(1)$ relative to file size), as only a single log entry exists in memory at any given time.

### 2. Recursive Schema Flattening
To support querying on deeply nested JSON structures (common in microservices), the `JsonFlattener` recursively traverses the JSON tree and normalizes it into a flat key-value map:
- `{"user": {"id": 123}}` $\Rightarrow$ `"user.id": "123"`
- This transformation enables every nested attribute to be indexed and filtered as a first-class citizen.

---

## 📊 Performance Characteristics

| Metric | Complexity | Rationale |
| :--- | :--- | :--- |
| **Ingestion** | $O(N)$ | Single-pass streaming with simultaneous indexing. |
| **Retrieval** | $O(1)$ | Direct byte-offset seek on `RandomAccessFile`. |
| **Search** | $O(k + m)$ | $k$ = filters, $m$ = matches. Dominated by index lookups. |
| **Memory** | $O(IndexSize)$ | Data stays on disk; only offsets and field levels are held in RAM. |

---

## 🛠 Engineering Stack

- **Runtime**: Java 17 (Spring Boot 3.x)
- **Serialization**: Jackson Streaming API
- **Concurrent Structures**: `ConcurrentHashMap`, `CopyOnWriteArrayList` for lock-free read access.
- **Frontend**: Next.js 14 with a reactive Query Builder UI.

## 🏁 Getting Started

Refer to the [Technical Setup Guide](docs/SETUP.md) (coming soon) or use the following:
- **BE**: `./mvnw spring-boot:run`
- **FE**: `npm run dev`
