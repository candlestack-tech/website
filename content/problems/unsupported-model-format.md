---
title: Unsupported model format
status: 415
summary: The file is not in a format CandleStack takes. It takes Keras models (.keras) and ONNX models (.onnx).
when:
  - The uploaded file is not a .keras or .onnx file.
  - The file is a pickle-based file, like .pt, .pth, .pkl or .joblib. These are never taken, as loading them can run any code.
todo:
  - Save a Keras model with model.save("model.keras") and upload that file.
  - Export PyTorch, TensorFlow and scikit-learn models to ONNX and upload the .onnx file.
---
