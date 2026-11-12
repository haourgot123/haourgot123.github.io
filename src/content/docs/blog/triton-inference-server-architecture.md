---
title: Triton Inference Server Architecture
draft: true
date: 2026-11-12
description: "Triton Inference Server là gì, dùng khi nào và xử lý request ra sao? Giải thích kiến trúc từ nhu cầu đưa model AI vào ứng dụng."
excerpt: "Khi nhiều service cần gọi model, mình cần một nơi nhận request, điều phối việc chạy và trả kết quả. Triton được xây dựng để lo phần phục vụ model này."
authors:
  - haourgot123
tags:
  - Triton Inference Server
---

Có một model chạy được rồi, bước tiếp theo là đưa nó vào ứng dụng. Backend cần gửi dữ liệu đến model và lấy kết quả về để xử lý tiếp. Khi nhiều người dùng cùng truy cập, mình còn phải lo model nhận request thế nào và dùng CPU/GPU ra sao.

**Triton Inference Server là phần mềm mã nguồn mở của NVIDIA giúp phục vụ model AI qua API.** Ứng dụng gửi input, Triton tổ chức việc chạy model rồi trả output. Việc chạy model để lấy kết quả này gọi là *inference*.

## Dùng Triton để làm gì?

Triton lo phần nhận và xử lý các yêu cầu chạy model. Nó hữu ích khi hệ thống có những nhu cầu như:

- **Nhiều service cùng gọi model:** các service gọi đến một nơi phục vụ model chung, thay vì mỗi service tự load và quản lý model.
- **Nhiều request đến cùng lúc:** cần xếp hàng, gom các request phù hợp thành batch và phân phối công việc đến các instance thực thi.
- **Phục vụ nhiều model:** các model có thể dùng runtime khác nhau nhưng cùng được đưa lên một Triton server, với cấu hình riêng cho từng model.

Với một hệ thống tìm kiếm dùng embedding và reranker, mình có thể phục vụ cả hai model bằng Triton. Backend ứng dụng quyết định lúc nào gọi embedding, lúc nào gọi reranker; Triton nhận từng yêu cầu và điều phối việc chạy model tương ứng.

## Kiến trúc bên trong

Sơ đồ dưới đây mô tả các phần đảm nhiệm những công việc đó:

<figure>
  <a href="/images/triton-inference-server/architecture.jpg" target="_blank" rel="noopener">
    <img src="/images/triton-inference-server/architecture.jpg" alt="Kiến trúc NVIDIA Triton: client gửi request qua HTTP, gRPC hoặc C API; scheduler điều phối đến backend để thực thi trên CPU/GPU. Model Management nạp model từ repository, còn health và metrics cung cấp thông tin vận hành." width="691" height="874" />
  </a>
  <figcaption>Nguồn: <a href="https://github.com/triton-inference-server/server/blob/main/docs/user_guide/architecture.md">NVIDIA</a> · <a href="/images/triton-inference-server/NVIDIA-LICENSE.txt">BSD-3-Clause</a>. Bấm vào hình để xem lớn.</figcaption>
</figure>

Có hai việc diễn ra ở đây: **chuẩn bị model để chạy** và **xử lý request gửi đến model**. Mình đi theo thứ tự đó sẽ dễ đọc hình hơn.

## Chuẩn bị model để phục vụ

**Model Repository** là nơi chứa file model, phiên bản và cấu hình. **Model Management** đọc từ repository và điều khiển việc load/unload model.

Khi load, backend tương ứng chuẩn bị model để thực thi trên CPU/GPU theo cấu hình. Model đã sẵn sàng thì có thể nhận nhiều request tiếp theo; mỗi lần gọi không cần load lại từ đầu.

## Một request đi qua những đâu?

### 1. Client gửi input

**Client Application** là ứng dụng đang cần kết quả từ model. Nó chuẩn bị input đúng định dạng rồi gửi qua **HTTP hoặc gRPC**. **Client Library** giúp anh em tạo request và đọc kết quả thuận tiện hơn.

Nhánh **C API** trong hình còn cho phép ứng dụng nhúng Triton vào cùng process và gọi trực tiếp.

### 2. Triton nhận và xếp lịch

**Inference Request** mang thông tin model cần gọi và dữ liệu đầu vào. Triton kiểm tra input rồi đưa request đến **scheduler của model đó**.

Scheduler quyết định giao việc cho instance nào. Nếu các instance đang bận, request có thể phải chờ trong **queue**. Khi bật **dynamic batching**, các request tương thích có thể được gom lại để model xử lý cùng nhau, giúp tận dụng tài nguyên tốt hơn.

Việc gom batch cũng có thể làm tăng thời gian chờ, nên cần chọn cấu hình theo yêu cầu latency và throughput của hệ thống. Với model cần giữ trạng thái giữa các request, Triton còn có **sequence batching** để điều phối các request cùng sequence về cùng instance.

### 3. Backend chạy model

**Framework Backend** là phần thực thi model bằng runtime phù hợp, như TensorRT, ONNX Runtime hoặc PyTorch. Model dùng backend nào thì Triton giao việc cho backend đó.

**Model instance** là một đơn vị thực thi của model để nhận công việc từ scheduler. Một model có thể có nhiều instance trên cùng hoặc khác CPU/GPU, tùy cấu hình và tài nguyên.

### 4. Kết quả quay về ứng dụng

Backend tính toán xong thì output được đưa vào **Inference Response** và trả về client. Ứng dụng lấy kết quả đó để tiếp tục xử lý nghiệp vụ hoặc hiển thị cho người dùng.

## Theo dõi khi vận hành

Khi đưa model lên chạy, mình cần biết nó đã sẵn sàng nhận request chưa và có đang xử lý ổn không.

**Status/Health** cung cấp trạng thái server và model. **Metrics** cung cấp các số liệu như lượng request, thời gian chờ, thời gian chạy và mức sử dụng tài nguyên. Nhờ đó, anh em có dữ liệu để tìm nguyên nhân khi request chậm hoặc điều chỉnh cấu hình phục vụ.

## Tài liệu tham khảo

- [Triton Inference Server — Giới thiệu](https://github.com/triton-inference-server/server#readme).
- [Triton Architecture — Kiến trúc tổng quan](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/architecture.html).
- [Model Repository — Lưu trữ model](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/model_repository.html).
- [Model Management — Quản lý việc load/unload](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/model_management.html).
- [Inference Protocols and APIs — HTTP, gRPC và C API](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/customization_guide/inference_protocols.html).
- [Batchers — Dynamic batching và sequence batching](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/batcher.html).
- [Triton Backends — Thực thi model](https://github.com/triton-inference-server/backend#readme).
- [Concurrent Model Execution — Nhiều model và instance](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/model_execution.html).
- [Open Inference Protocol — Request và response](https://github.com/kserve/open-inference-protocol/blob/main/specification/protocol/inference_rest.md).
- [Metrics — Các chỉ số vận hành](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/metrics.html).
