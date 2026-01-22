# Backend Methodology & Diagrams

This document contains architectural diagrams for the Log Explorer backend, generated from the source code.

## 1. Class Diagram
High-level overview of the system components and their relationships.

```mermaid
classDiagram
    class LogController {
        +uploadLogFile(file, description, tags)
        +listFiles()
        +searchLogs(fileId, queryFilters)
        +getFields(fileId)
    }

    class LogService {
        -ConcurrentHashMap~String, LogSegment~ activeSegments
        +processUploadedFile(file, originalName, description, tags)
        +loadExistingSegments()
        +searchLogs(fileId, queryFilters)
        +getAvailableFields(fileId)
    }

    class LogMetadataRepository {
        <<interface>>
        +findAllByOrderByIngestedAtDesc()
    }

    class LogParser {
        <<interface>>
        +parse(InputStream, Consumer~IndexedLogMap~)
    }

    class JacksonStreamLogParser {
        +parse(InputStream, Consumer~IndexedLogMap~)
    }

    class LogSegment {
        -Map~String, Map~String, List~Long~~~ universalIndex
        -RandomAccessFile randomAccessFile
        +init()
        +addToIndex(rawLogMap, byteOffset)
        +search(queryFilters) Stream~Map~
        +getIndexedFields()
    }

    class LogFileMetadata {
        -String fileId
        -String fileName
        -String storagePath
        -LogSource source
        -List~String~ tags
    }

    class LogEntry {
        <<record>>
        +Instant timestamp
        +LogLevel logLevel
        +String serviceName
        +String message
        +Map metadata
    }

    LogController --> LogService : uses
    LogService --> LogMetadataRepository : persists metadata
    LogService --> LogParser : uses for digestion
    LogService --> LogSegment : manages lifecycle
    LogService ..> LogFileMetadata : creates/reads
    JacksonStreamLogParser ..|> LogParser : implements
    LogParser ..> LogEntry : produces (abstractly)
    LogSegment --> LogEntry : reads/reconstructs
```

## 2. Sequence Diagram: File Upload & Ingestion
The flow when a user uploads a new log file.

```mermaid
sequenceDiagram
    actor User
    participant Controller as LogController
    participant Service as LogService
    participant Repo as LogMetadataRepository
    participant Parser as JacksonStreamLogParser
    participant Segment as LogSegment
    participant Disk as FileSystem

    User->>Controller: POST /upload (file)
    Controller->>Service: processUploadedFile(file, method, tags)
    
    Service->>Segment: new LogSegment(fileId, path)
    Service->>Segment: init() (Open RandomAccessFile)
    
    Service->>Parser: parse(inputStream)
    
    loop Every JSON Object
        Parser->>Parser: Read Object & Byte Offset
        Parser->>Service: Callback(LogEntry, Offset)
        Service->>Segment: addToIndex(LogEntry, Offset)
        Segment->>Segment: Flatten JSON to Map~Field, Value~
        Segment->>Segment: Update Inverted Index (Field to Value to Offsets)
    end

    Service->>Repo: save(LogFileMetadata)
    Service->>Controller: return fileId
    Controller->>User: 200 OK (fileId)
```

## 3. Sequence Diagram: Search
The flow when a user searches for logs.

```mermaid
sequenceDiagram
    actor User
    participant Controller as LogController
    participant Service as LogService
    participant Segment as LogSegment
    participant Disk as FileSystem

    User->>Controller: POST /{fileId}/search (Filters)
    Controller->>Service: searchLogs(fileId, Filters)
    Service->>Segment: search(Filters)
    
    Note over Segment: Step 1: Index Lookup
    Segment->>Segment: Look up Field/Value in UniversalIndex
    Segment->>Segment: Retreive List of Byte Offsets
    Segment->>Segment: Intersect Offsets (AND logic)
    
    Note over Segment: Step 2: Random Access Read
    loop For each matched Offset
        Segment->>Disk: seek(Offset)
        Disk-->>Segment: Read Bytes
        Segment->>Segment: Deserialize to LogEntry
    end
    
    Segment-->>Service: Stream~LogEntry~
    Service-->>Controller: Stream~LogEntry~
    Controller-->>User: NDJSON Response Stream
```

## 4. Storage & Indexing Structure
Conceptual view of how `LogSegment` organizes data in memory vs on disk.

```mermaid
classDiagram
    class LogSegment {
        +ConcurrentHashMap universalIndex
        +RandomAccessFile diskHandle
    }

    class UniversalIndex {
        Map~Field, ValueMap~
    }

    class ValueMap {
        Map~Value, List~Offset~~
    }

    class DiskFile {
        List~LogEntry~ logs
    }

    LogSegment *--UniversalIndex : In-Memory
    UniversalIndex *-- ValueMap
    LogSegment ..> DiskFile : Points via RandomAccessFile
    ValueMap --> DiskFile : Contains Byte Offsets
```
