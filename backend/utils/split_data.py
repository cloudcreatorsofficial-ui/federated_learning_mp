import os
import shutil
import random

SRC = "data/processed"
DEST = "data/hospitals"
CLIENTS = 3

os.makedirs(DEST, exist_ok=True)
for i in range(1, CLIENTS+1):
	os.makedirs(os.path.join(DEST, f"client{i}", "normal"), exist_ok=True)
	os.makedirs(os.path.join(DEST, f"client{i}", "diseased"), exist_ok=True)

for cls in ["normal", "diseased"]:
	src_dir = os.path.join(SRC, cls)
	if not os.path.isdir(src_dir):
		print(f"Source class folder not found: {src_dir}")
		continue

	images = [f for f in os.listdir(src_dir) if os.path.isfile(os.path.join(src_dir, f))]
	random.shuffle(images)
	# distribute round-robin
	chunks = [images[i::CLIENTS] for i in range(CLIENTS)]

	for i, chunk in enumerate(chunks):
		dest_dir = os.path.join(DEST, f"client{i+1}", cls)
		for img in chunk:
			shutil.copy(
				os.path.join(src_dir, img),
				os.path.join(dest_dir, img)
			)

print("Hospital data split done.")
