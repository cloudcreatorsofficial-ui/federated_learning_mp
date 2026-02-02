import tensorflow as tf
from tensorflow.keras import layers, models

def create_model():
    """
    Create a CNN model for medical image classification.
    Input: Grayscale images (224x224x1)
    Output: Binary classification (Normal vs Diseased)
    """
    model = models.Sequential([
        layers.Input(shape=(224, 224, 1)),
        layers.Conv2D(32, (3, 3), activation='relu'),
        layers.MaxPooling2D(),
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.MaxPooling2D(),
        layers.Flatten(),
        layers.Dense(128, activation='relu'),
        layers.Dense(1, activation='sigmoid')
    ])

    model.compile(
        optimizer='adam',
        loss='binary_crossentropy',
        metrics=['accuracy']
    )
    return model


if __name__ == "__main__":
    model = create_model()
    model.summary()
