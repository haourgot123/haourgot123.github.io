---
title: "Triton Inference Server: Model Management"
draft: false
date: 2026-11-12
description: "Các điểm cần nắm về Model Management trong Triton: repository, cấu hình, phiên bản, load/unload, tối ưu và các trường hợp đặc biệt."
excerpt: "Đưa model lên Triton rồi, mình còn cần quản lý phiên bản, cập nhật model và chọn cách phục vụ phù hợp. Bài này tập trung vào những việc đó."
authors:
  - haourgot123
tags:
  - Triton Inference Server
---

Ở [bài về kiến trúc Triton](/blog/triton-inference-server-architecture/), mình đã đi qua luồng nhận request và chạy model. Khi vận hành, anh em sẽ gặp thêm những việc như đưa phiên bản mới lên, chọn model cần load và điều chỉnh cách phục vụ khi tải tăng.

Nhóm **Model Management** trong tài liệu NVIDIA tập hợp các kiến thức phục vụ những nhu cầu này. Mình sẽ đi từ việc chuẩn bị model đến lúc cập nhật và tối ưu nó.

## Repository: chuẩn bị file model

**Model Repository** là nơi Triton đọc file model và cấu hình. Mỗi model có thư mục riêng; bên trong là các thư mục phiên bản được đặt tên bằng số. Định dạng file cần cung cấp phụ thuộc backend đang dùng.

Repository có thể nằm trên ổ đĩa hoặc storage như S3, GCS và Azure Storage. Một Triton server có thể đọc từ nhiều repository.

Điểm cần nhớ khi đưa bản mới lên: **có file trong repository chưa có nghĩa phiên bản đó đã được phục vụ**. Mình còn phải kiểm tra version policy, chế độ load model và trạng thái ready.

## Configuration: khai báo cách phục vụ

File **`config.pbtxt`** cho Triton biết model nhận gì và được chạy như thế nào. Những phần thường cần quan tâm:

| Thành phần | Quyết định điều gì? |
| --- | --- |
| Backend | Runtime dùng để thực thi model. |
| Input/output | Tên tensor, datatype và shape. |
| `max_batch_size` | Batch tối đa được phép nhận. |
| Scheduling | Cách xếp lịch, gom batch. |
| `instance_group` | Số instance và nơi thực thi trên CPU/GPU. |
| `version_policy` | Các phiên bản được phép phục vụ. |

Version policy có ba lựa chọn: **All** cho tất cả phiên bản, **Latest** cho các phiên bản có số lớn nhất, và **Specific** cho những phiên bản được chỉ định. Mặc định là **Latest với một phiên bản**.

Một số backend có thể suy ra cấu hình tối thiểu từ model. Các lựa chọn phục vụ vẫn cần được kiểm tra theo nhu cầu. Nếu có cấu hình **warmup**, Triton chỉ báo model ready sau khi các request warmup hoàn thành thành công.

## Controls: quyết định lúc nào load/unload

Khi có model mới hoặc sửa cấu hình, **control mode** quyết định Triton đưa thay đổi đó vào phục vụ ra sao.

| Chế độ | Cách hoạt động |
| --- | --- |
| `NONE` | Thử load các model khi khởi động, sau đó bỏ qua thay đổi repository. Đây là mặc định. |
| `EXPLICIT` | Chọn model load lúc khởi động, rồi chủ động gọi API để load/unload. |
| `POLL` | Định kỳ kiểm tra repository và xử lý thay đổi. |

Với `EXPLICIT`, nếu chưa chọn model lúc khởi động thì server chưa load model nào. Sau đó, mình gọi API để load/unload khi cần.

Với `POLL`, Triton có thể quét đúng lúc file đang được cập nhật và đọc phải dữ liệu chưa hoàn chỉnh. Vì vậy, **NVIDIA không khuyến nghị dùng `POLL` trong production**.

Hai thứ dễ nhầm ở đây: **version policy chọn phiên bản được phép phục vụ; control mode quyết định cách thay đổi có hiệu lực**. Khi kiểm tra một bản cập nhật, mình cần xem cả hai.

## Optimization: điều chỉnh theo tải thực tế

Sau khi model chạy đúng, mình cần xem nó đáp ứng được bao nhiêu request và mất bao lâu để trả kết quả. Các hướng tối ưu chính gồm:

- **Dynamic batching:** gom request tương thích để thực thi cùng nhau.
- **Nhiều instance:** tạo thêm đơn vị thực thi để nhận công việc đồng thời.
- **Tối ưu theo runtime:** sử dụng các khả năng tăng tốc mà backend hỗ trợ.

Cách làm là đo cấu hình ban đầu bằng **Performance Analyzer**, thay từng yếu tố rồi so sánh lại latency, throughput và bộ nhớ. Tăng batch hoặc số instance có thể hữu ích, nhưng cũng có thể làm request chờ lâu hơn hoặc tốn thêm tài nguyên. Cấu hình phù hợp phải được đo với tải mình cần phục vụ.

## Decoupled models: trả kết quả từng phần

Với các tác vụ như nhận dạng giọng nói hoặc sinh nội dung, mình có thể muốn trả kết quả dần trong lúc model vẫn đang xử lý.

**Decoupled model** cho phép một request nhận nhiều response, thay vì chỉ một response hoàn chỉnh. Backend cũng có thể trả response khác thứ tự các request được thực thi.

Để dùng được, model cần khai báo transaction policy `decoupled`. Với API inference gốc của Triton, client sử dụng **gRPC streaming hai chiều**; HTTP `/infer` và gRPC unary không hỗ trợ kiểu trả kết quả này.

Client cần theo dõi tín hiệu **FINAL** để biết request đã kết thúc. Nhận được một phần output chưa có nghĩa model đã xử lý xong.

## Custom operators: khi model cần phép toán riêng

Một model có thể phụ thuộc vào phép toán hoặc layer do mình tự viết. Để chạy được, runtime trong Triton cũng phải có phần triển khai phép toán đó.

Tùy backend, mình cần cung cấp TensorRT plugin, PyTorch custom operation hoặc thư viện custom operation cho ONNX Runtime. Thư viện phải tương thích với phiên bản runtime đang dùng trong Triton.

Đây là phần nên kiểm tra khi model báo thiếu operator lúc load hoặc thực thi. **Custom operator** bổ sung phép toán bên trong model; **custom backend** triển khai cách thực thi model cho Triton.

## Tài liệu tham khảo

- [Model Repository — Lưu trữ model và phiên bản](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/model_repository.html).
- [Model Configuration — Cấu hình phục vụ model](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/model_configuration.html).
- [Model Management — Các chế độ load/unload](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/model_management.html).
- [Optimization — Đo và tối ưu hiệu năng](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/optimization.html).
- [Decoupled Backends and Models — Cách trả nhiều response](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/decoupled_models.html).
- [Custom Operations — Tích hợp phép toán riêng](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/custom_operations.html).
