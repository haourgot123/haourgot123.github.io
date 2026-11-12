---
title: "Triton Inference Server: Model Configuration"
draft: false
date: 2026-11-12
description: "Ví dụ config.pbtxt cho DenseNet-121 ONNX: một input ảnh, một output phân loại và bảng giải thích các tham số Triton thường dùng."
excerpt: "Dùng DenseNet-121 với một đầu vào và một đầu ra để viết file config.pbtxt, rồi đọc ý nghĩa các tham số chính."
authors:
  - haourgot123
tags:
  - Triton Inference Server
---

## 1. Lý thuyết ngắn

**`config.pbtxt` cho Triton biết model nhận/trả dữ liệu gì và chạy như thế nào.** Ví dụ này dùng DenseNet-121 để phân loại ảnh: nhận một tensor ảnh và trả điểm cho 1.000 lớp ImageNet. **Batch** gom nhiều ảnh để chạy cùng nhau; **instance** là một đơn vị thực thi model bên trong Triton, gần giống replica ở mức model.

## 2. Viết file `config.pbtxt`

### Chuẩn bị model

Ví dụ dùng DenseNet-121 export sang ONNX với batch động, đặt tên input là `images` và output là `logits`:

| Tensor | Datatype | Shape |
| --- | --- | --- |
| `images` | FP32 | `[B, 3, 224, 224]` |
| `logits` | FP32 | `[B, 1000]` |

`B` là số ảnh; `3` là ba kênh RGB. Trước khi gửi, ảnh cần được resize/crop, normalize đúng theo weights và chuyển sang tensor NCHW. Tên và shape phải khớp bản ONNX đã export.

Đặt `config.pbtxt` tại `model_repository/densenet121/`; file model nằm tại `model_repository/densenet121/1/model.onnx`.

### Viết cấu hình

Cấu hình này dùng một instance trên GPU 0, batch tối đa 8. Các giá trị batch và queue là ví dụ để điều chỉnh theo tải thực tế.

```protobuf title="densenet121/config.pbtxt"
name: "densenet121"
backend: "onnxruntime"
max_batch_size: 8

input [
  {
    name: "images"
    data_type: TYPE_FP32
    format: FORMAT_NCHW
    dims: [3, 224, 224]
  }
]

output [
  {
    name: "logits"
    data_type: TYPE_FP32
    dims: [1000]
  }
]

dynamic_batching {
  max_queue_delay_microseconds: 1000
  default_queue_policy {
    max_queue_size: 128
    default_timeout_microseconds: 50000
    timeout_action: REJECT
  }
}

instance_group [
  {
    count: 1
    kind: KIND_GPU
    gpus: [0]
  }
]

version_policy {
  latest { num_versions: 1 }
}
```

[Tải file mẫu](/examples/triton-model-configuration/config.pbtxt).

### Đọc các tham số chính

| Tham số | Ý nghĩa trong file trên |
| --- | --- |
| `name` | Tên model để client gọi, khớp tên thư mục. |
| `backend` | Dùng ONNX Runtime để chạy model. |
| `max_batch_size: 8` | Cho phép batch tối đa 8, nếu artifact hỗ trợ. |
| `input`, `output` | Khai báo tên, datatype và shape của tensor. |
| `format: FORMAT_NCHW` | Khai báo layout ảnh: batch, kênh màu, chiều cao, chiều rộng. |
| `dims: [3, 224, 224]` | Mỗi ảnh có 3 kênh, kích thước 224 × 224. |
| `dims: [1000]` | Mỗi ảnh nhận 1.000 điểm phân loại. |
| `dynamic_batching` | Gom các request tương thích để chạy chung. |
| `max_queue_delay_microseconds: 1000` | Cho phép chờ thêm 1 ms để gom batch. |
| `max_queue_size: 128` | Queue tối đa 128 request. |
| `default_timeout_microseconds: 50000` | Timeout mặc định trong queue là 50 ms. |
| `timeout_action: REJECT` | Trả lỗi khi request quá hạn trong queue. |
| `instance_group.count: 1` | Một instance trên mỗi GPU được chọn. |
| `kind: KIND_GPU`, `gpus: [0]` | Chạy nhóm instance trên GPU 0. |
| `latest.num_versions: 1` | Phục vụ một phiên bản có số lớn nhất. |

Ba chỗ dễ nhầm:

- Gửi hai ảnh: input có shape **`[2, 3, 224, 224]`**, output là **`[2, 1000]`**. `dims` không chứa batch dimension khi `max_batch_size > 0`.
- Triton nhận tensor đã tiền xử lý. Khai báo `format` không tự resize, normalize hay chuyển layout ảnh.
- `count: 2` với `gpus: [0, 1]` tạo **4 instance**. Muốn chạy CPU, đổi sang `KIND_CPU` và bỏ `gpus`, nếu model/backend hỗ trợ.

Thời gian chờ gom batch và queue timeout không giới hạn thời gian tính toán của model.

### Load và kiểm tra

Trên server có Triton, ONNX Runtime backend và GPU phù hợp:

```bash
tritonserver --model-repository=/absolute/path/to/model_repository
```

Sau đó kiểm tra model ready và config thực tế:

```bash
curl --fail --include http://localhost:8000/v2/models/densenet121/ready
curl --fail http://localhost:8000/v2/models/densenet121/config
```

`/config` giúp xem cả giá trị Triton tự bổ sung. Sau khi model ready, thử inference với input hợp lệ để kiểm tra output.

Các nhóm `optimization`, `parameters`, `model_warmup`, `response_cache` và `model_transaction_policy` chỉ bổ sung khi cần tối ưu runtime, tùy chọn backend, warmup, cache hoặc trả kết quả từng phần.

## Tài liệu tham khảo

- [Model Configuration — NVIDIA](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/model_configuration.html).
- [ModelConfig protobuf — Định nghĩa tham số](https://github.com/triton-inference-server/common/blob/main/protobuf/model_config.proto).
- [Batchers — Cách gom batch và quản lý queue](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/batcher.html).
- [ONNX Runtime Backend](https://github.com/triton-inference-server/onnxruntime_backend).
- [Torchvision DenseNet-121 — Model và tiền xử lý ảnh](https://docs.pytorch.org/vision/stable/models/generated/torchvision.models.densenet121.html).
- [PyTorch ONNX — Export model](https://docs.pytorch.org/docs/stable/onnx.html).
