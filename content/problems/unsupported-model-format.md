---
title: Unsupported model format
status: 415
summary: The file is not in a format CandleStack takes. It takes Keras models (.keras) now and ONNX models (.onnx) later.
when:
  - The uploaded file is not a .keras file.
  - The file is a pickle-based file, like .pt, .pth, .pkl or .joblib. These are never taken, as loading them can run any code.
todo:
  - Save a Keras model with model.save("model.keras") and upload that file.
  - Export PyTorch, TensorFlow and scikit-learn models to ONNX; ONNX files will be taken later.
---
