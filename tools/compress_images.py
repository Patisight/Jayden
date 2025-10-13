import os
from PIL import Image

def compress_image(image_path, output_path, target_size_kb=100, quality=90):
    """
    Compresses an image to a target size (in KB) while trying to maintain quality.
    Uses a binary search approach to find the optimal quality setting.
    """
    img = Image.open(image_path)
    
    # Convert to RGB if not already, to avoid issues with some image types (e.g., PNG with alpha)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    # Initial save to check size
    img.save(output_path, optimize=True, quality=quality)
    current_size_kb = os.path.getsize(output_path) / 1024

    if current_size_kb <= target_size_kb:
        print(f"Image {image_path} is already within target size or compressed successfully at initial quality.")
        return

    # Binary search for optimal quality
    low = 10
    high = quality
    best_quality = low
    
    while low <= high:
        mid = (low + high) // 2
        img.save(output_path, optimize=True, quality=mid)
        current_size_kb = os.path.getsize(output_path) / 1024

        if current_size_kb <= target_size_kb:
            best_quality = mid
            low = mid + 1
        else:
            high = mid - 1
    
    # Save with the best found quality
    img.save(output_path, optimize=True, quality=best_quality)
    final_size_kb = os.path.getsize(output_path) / 1024
    print(f"Compressed {image_path} to {final_size_kb:.2f} KB (target: {target_size_kb} KB) with quality {best_quality}.")

def process_directory(directory_path, target_size_kb=200):
    """
    Traverses a directory and compresses all image files found.
    """
    for root, _, files in os.walk(directory_path):
        for file in files:
            file_path = os.path.join(root, file)
            # Check if it's an image file (you can extend this list)
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff')):
                try:
                    # Overwrite the original file
                    compress_image(file_path, file_path, target_size_kb)
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")

if __name__ == "__main__":
    target_path = input("请输入要压缩的文件夹路径或图片文件路径: ")
    
    if os.path.isdir(target_path):
        print(f"开始处理目录: {target_path}")
        process_directory(target_path)
        print("图片压缩完成！")
    elif os.path.isfile(target_path):
        print(f"开始处理文件: {target_path}")
        try:
            compress_image(target_path, target_path) # Overwrite the original file
            print("图片压缩完成！")
        except Exception as e:
            print(f"Error processing {target_path}: {e}")
    else:
        print(f"错误: 路径 '{target_path}' 不是一个有效的文件夹或文件。")