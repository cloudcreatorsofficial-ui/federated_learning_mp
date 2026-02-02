import os
import cv2

# Config
RAW_DIR = "data/raw"
OUT_DIR = "data/processed"
IMG_SIZE = 224

os.makedirs(os.path.join(OUT_DIR, "normal"), exist_ok=True)
os.makedirs(os.path.join(OUT_DIR, "diseased"), exist_ok=True)

def is_image(name):
	return name.lower().endswith((".png", ".jpg", ".jpeg", ".bmp"))

def process_folder(src_folder, target_folder, start_idx=0):
	idx = start_idx
	# Walk recursively to include images in nested directories
	for root, _, files in os.walk(src_folder):
		for img_name in sorted(files):
			if not is_image(img_name):
				continue

			img_path = os.path.join(root, img_name)
			img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
			if img is None:
				print("Skipping (could not read):", img_path)
				continue

			img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
			out_name = f"{os.path.basename(target_folder)}_{idx:06d}.png"
			out_path = os.path.join(target_folder, out_name)
			cv2.imwrite(out_path, img)
			idx += 1

	return idx

def find_and_process():
	# Map source folders (case-insensitive) to targets
	mapping = {
		"normal": ["normal", "Normal"],
		"diseased": ["sick", "Sick", "diseased", "Diseased"]
	}

	for target, src_names in mapping.items():
		target_folder = os.path.join(OUT_DIR, target)
		os.makedirs(target_folder, exist_ok=True)
		idx = 0
		for name in src_names:
			src_folder = os.path.join(RAW_DIR, name)
			if not os.path.isdir(src_folder):
				continue
			print(f"Processing {src_folder} -> {target_folder}")
			idx = process_folder(src_folder, target_folder, start_idx=idx)

	print("Preprocessing completed.")

if __name__ == '__main__':
	find_and_process()
