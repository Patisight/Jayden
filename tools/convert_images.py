import os
import argparse
from PIL import Image

def convert_image(input_path, output_format='webp', quality=80):
    try:
        img = Image.open(input_path)
        # Convert to RGB if not already, as WebP doesn't support all modes directly
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')

        output_dir = os.path.dirname(input_path)
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_path = os.path.join(output_dir, f"{base_name}.{output_format}")

        img.save(output_path, output_format, quality=quality)
        print(f"Successfully converted {input_path} to {output_path}")
    except Exception as e:
        print(f"Error converting {input_path}: {e}")

def main():
    parser = argparse.ArgumentParser(description="Convert images to WebP or other formats.")
    parser.add_argument("-f", "--format", default="webp", help="Output format (e.g., webp, jpeg, png). Default is webp.")
    parser.add_argument("-q", "--quality", type=int, default=80, help="Quality for output image (0-100). Default is 80.")

    args = parser.parse_args()

    input_path_str = input("请输入要转换的图片文件或文件夹路径 (留空则处理当前目录): ").strip()
    if not input_path_str:
        input_path = os.path.abspath('.')
    else:
        input_path = os.path.abspath(input_path_str)

    if os.path.isfile(input_path):
        convert_image(input_path, args.format, args.quality)
    elif os.path.isdir(input_path):
        for root, _, files in os.walk(input_path):
            for file in files:
                if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff')):
                    current_file_path = os.path.join(root, file)
                    convert_image(current_file_path, args.format, args.quality)
    else:
        print(f"Error: Invalid input path '{input_path_str}'. Must be a file or a directory.")

if __name__ == "__main__":
    main()