import tensorflow as tf
import numpy as np
import os


def aggregate_models():
    """
    Federated Averaging: Aggregate models from all clients.
    Loads trained models from all clients, averages their weights,
    and creates a new global model.
    """
    
    client_model_paths = [
        "clients/client1/local_model.h5",
        "clients/client2/local_model.h5",
        "clients/client3/local_model.h5",
    ]
    
    # Check if all client models exist
    for path in client_model_paths:
        if not os.path.exists(path):
            print(f"Error: Model not found at {path}")
            return False
    
    # Load all client models
    print("Loading client models...")
    client_models = []
    for path in client_model_paths:
        try:
            model = tf.keras.models.load_model(path)
            client_models.append(model)
            print(f"  Loaded: {path}")
        except Exception as e:
            print(f"  Error loading {path}: {e}")
            return False
    
    if len(client_models) == 0:
        print("No client models loaded. Exiting.")
        return False
    
    # Perform Federated Averaging
    print("\nPerforming Federated Averaging...")
    new_weights = []
    
    # Get weights from all models
    all_model_weights = [m.get_weights() for m in client_models]
    
    # Average weights across all clients
    for weights in zip(*all_model_weights):
        # weights is a tuple of weight matrices from different clients
        averaged_weight = np.mean(weights, axis=0)
        new_weights.append(averaged_weight)
    
    # Create a new global model with averaged weights
    print("Creating updated global model...")
    from server.global_model import create_model
    global_model = create_model()
    global_model.set_weights(new_weights)
    
    # Save the updated global model
    os.makedirs("server", exist_ok=True)
    model_save_path = "server/global_model_updated.h5"
    global_model.save(model_save_path)
    
    print(f"\nGlobal model updated and saved to: {model_save_path}")
    print("Federated Averaging Round Completed Successfully!")
    
    return True


if __name__ == "__main__":
    aggregate_models()
