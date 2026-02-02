import tensorflow as tf
import numpy as np
import os
import sys

# Add backend to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from server.global_model import create_model

DATA_DIR = "data/hospitals/client2"

def load_data():
    """
    Load images from normal and diseased directories.
    Returns: X (images), y (labels: 0=normal, 1=diseased)
    """
    X, y = [], []

    for label, cls in enumerate(["normal", "diseased"]):
        path = os.path.join(DATA_DIR, cls)
        if not os.path.exists(path):
            print(f"Path not found: {path}")
            continue
            
        images = [img for img in os.listdir(path) if img.endswith(('.png', '.jpg', '.jpeg'))]
        print(f"Loading {len(images)} {cls} images from client2...")
        
        for img in images:
            img_path = os.path.join(path, img)
            try:
                image = tf.keras.preprocessing.image.load_img(
                    img_path, color_mode="grayscale", target_size=(224, 224)
                )
                image = tf.keras.preprocessing.image.img_to_array(image) / 255.0
                X.append(image)
                y.append(label)
            except Exception as e:
                print(f"Error loading {img}: {e}")

    return np.array(X), np.array(y)


def train():
    print("Client2 Training Started...")
    model = create_model()
    X, y = load_data()
    
    if len(X) == 0:
        print("No training data loaded. Exiting.")
        return
    
    print(f"Training on {len(X)} samples...")
    model.fit(X, y, epochs=2, batch_size=8, validation_split=0.1)
    
    # Save the local model
    os.makedirs("clients/client2", exist_ok=True)
    model.save("clients/client2/local_model.h5")
    print("Client2 training done. Model saved to clients/client2/local_model.h5")


if __name__ == "__main__":
    train()
