import os
from PIL import Image

def compress_image(
    image_path,
    output_path,
    target_size_kb=100,
    max_dimension=1920,  # 网页图片最佳上限（1920px宽）
    output_format=None,  # 自动判断格式（优先WebP）
    min_quality=10,      # 最低质量阈值（避免模糊）
    png_compress_level=2 # PNG无损压缩等级（1=快/大，9=慢/小）
):
    # 0. 先检查原图文件大小，如果已达标，直接返回（不压缩、不缩放）
    original_size_kb = os.path.getsize(image_path) / 1024
    if original_size_kb <= target_size_kb:
        print(f"✅ 原图已达标：{original_size_kb:.2f}KB ≤ {target_size_kb}KB，无需压缩")
        return original_size_kb, image_path  # 返回原大小和路径，用于统计

    # 1. 打开图片（保留原始模式，不强制转RGB）
    img = Image.open(image_path)
    original_mode = img.mode
    original_size = img.size  # 记录原图尺寸

    # 2. 智能缩放分辨率（只缩小不放大，用LANCZOS算法保质量）
    if max_dimension and (img.width > max_dimension or img.height > max_dimension):
        scale = max_dimension / max(img.width, img.height)
        new_size = (int(img.width * scale), int(img.height * scale))
        img = img.resize(new_size, Image.Resampling.LANCZOS)
        print(f"✅ 缩放分辨率: {original_size[0]}×{original_size[1]} → {new_size[0]}×{new_size[1]}")

    # 3. 自动判断输出格式（优先WebP，保留透明通道）
    if not output_format:
        output_format = "webp" if original_mode in ("RGBA", "P") else "webp"
    output_format = output_format.lower()

    # 新增：检查扩展名是否匹配，如果不匹配，打印警告（但仍覆盖原路径）
    original_ext = os.path.splitext(output_path)[1].lower()
    if original_ext != f".{output_format}":
        print(f"⚠️ 扩展名不匹配：原.{original_ext} → 内容{output_format.upper()}。建议手动重命名为.{output_format}以确保兼容。")

    # 4. 嵌套函数：保存图片并返回大小（用临时变量避免作用域问题）
    def save_and_get_size(quality):
        # 关键修复：用临时变量temp_img，不修改外部的img！
        temp_img = img.copy()  # 复制原图，避免后续操作影响外部img
        temp_size_kb = 0

        if output_format == "webp":
            # WebP支持透明+有损/无损切换
            lossless = quality >= 95  # 质量≥95用无损，否则有损
            temp_img.save(
                output_path,
                format="WebP",
                quality=quality,
                lossless=lossless,
                optimize=True
            )

        elif output_format == "jpeg":
            # JPEG不支持透明，需转RGB（用临时变量，不影响外部img）
            if temp_img.mode in ("RGBA", "P"):
                temp_img = temp_img.convert("RGB")
            temp_img.save(
                output_path,
                format="JPEG",
                quality=quality,
                optimize=True,
                progressive=True  # 渐进式加载（先模糊后清晰）
            )

        elif output_format == "png":
            # PNG无损压缩（用compress_level控制体积，quality参数忽略）
            temp_img.save(
                output_path,
                format="PNG",
                compress_level=png_compress_level,
                optimize=True
            )

        # 计算文件大小（KB）
        temp_size_kb = os.path.getsize(output_path) / 1024
        return temp_size_kb

    # 5. 改进：先尝试最高质量100（无损），如果达标，直接用
    # 对于PNG，无损固定，所以直接检查一次
    if output_format == "png":
        png_size = save_and_get_size(quality=100)  # quality忽略，但统一调用
        if png_size <= target_size_kb:
            print(f"🎉 PNG无损压缩达标：{png_size:.2f}KB ≤ {target_size_kb}KB")
            return png_size, output_path
        else:
            print(f"⚠️ PNG无损后仍超标：{png_size:.2f}KB > {target_size_kb}KB，建议转换格式或进一步缩放")
            # 仍保存无损版本
            return png_size, output_path
    else:
        # 非PNG：尝试100质量
        current_size = save_and_get_size(quality=100)
        if current_size <= target_size_kb:
            print(f"🎉 最高质量100达标：{current_size:.2f}KB ≤ {target_size_kb}KB（无损）")
            return current_size, output_path

    # 差距<10KB时，视觉无差异，无需继续压缩
    if current_size - target_size_kb < 10:
        print(f"🎉 接近目标：{current_size:.2f}KB（差距<10KB，无需进一步压缩）")
        return current_size, output_path

    # 二分法优化（low=最低质量，high=100）
    low, high = min_quality, 100
    best_quality = min_quality
    best_size = float('inf')

    while low <= high:
        mid_quality = (low + high) // 2
        mid_size = save_and_get_size(mid_quality)

        # 记录最优解：优先大小<=目标且质量最高；如果都>目标，选择大小最接近且质量高的
        if mid_size <= target_size_kb:
            if mid_quality > best_quality:
                best_quality = mid_quality
                best_size = mid_size
            low = mid_quality + 1  # 尝试更高质量
        else:
            # 如果所有都>目标，记录大小最接近的（但质量不低于min）
            if mid_size < best_size:
                best_size = mid_size
                best_quality = mid_quality
            high = mid_quality - 1  # 降低质量

    # 如果best_size > target_size_kb，说明无法<=目标，用最接近的
    if best_size > target_size_kb:
        print(f"⚠️ 无法达到目标大小，使用最接近质量{best_quality}：{best_size:.2f}KB")
    else:
        print(f"🎉 找到最高质量{best_quality}达标：{best_size:.2f}KB ≤ {target_size_kb}KB")

    # 最终用最优质量保存（覆盖之前的临时保存）
    final_size = save_and_get_size(best_quality)
    print(f"📊 压缩总结：原{original_size_kb:.2f}KB → {final_size:.2f}KB | "
          f"压缩率={(1 - final_size / original_size_kb) * 100:.1f}% | "
          f"格式={output_format} | 质量={best_quality}")
    return final_size, output_path

def process_directory(  # 批量处理文件夹，自动备份原图
    directory_path,
    target_size_kb=60,
    max_dimension=1920,
    output_format="webp"
):
    # 批量处理文件夹，自动备份原图
    total_original = 0
    total_compressed = 0
    processed_count = 0
    skipped_count = 0

    for root, _, files in os.walk(directory_path):
        for file in files:
            # 跳过所有.backup备份文件
            if file.endswith('.backup'):
                continue
            
            file_path = os.path.join(root, file)
            # 支持的图片格式
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp')):
                try:
                    original_size = os.path.getsize(file_path) / 1024
                    total_original += original_size

                    # 备份原图（避免误操作丢失）
                    backup_path = f"{file_path}.backup"
                    if not os.path.exists(backup_path):
                        with Image.open(file_path) as backup_img:
                            # 修复：指定格式保存备份，避免未知扩展名错误
                            backup_format = backup_img.format or 'PNG'  # 默认PNG如果无法识别
                            backup_img.save(backup_path, format=backup_format)
                        print(f"📁 已备份原图：{os.path.basename(backup_path)}")

                    # 执行压缩（覆盖原文件）
                    compressed_size, compressed_path = compress_image(
                        file_path,
                        output_path=file_path,
                        target_size_kb=target_size_kb,
                        max_dimension=max_dimension,
                        output_format=output_format
                    )

                    total_compressed += compressed_size
                    processed_count += 1

                except Exception as e:
                    print(f"❌ 处理失败 {os.path.basename(file_path)}：{str(e)}")
                    skipped_count += 1

    # 批量总结
    if processed_count > 0:
        overall_rate = (1 - total_compressed / total_original) * 100 if total_original > 0 else 0
        print(f"📊 批量总结：处理{processed_count}张，跳过{skipped_count}张 | "
              f"总原{total_original:.2f}KB → {total_compressed:.2f}KB | 整体压缩率{overall_rate:.1f}%")

if __name__ == "__main__":
    target_path = input("请输入要压缩的文件夹路径或图片文件路径: ")
    #target_path = r"C:\Users\16438\Desktop\myWebsite\project3\files\productPysical.webp"
    
    if os.path.isdir(target_path):
        print(f"🚀 开始处理目录: {target_path}（格式=WebP，目标=60KB，最大边长=1920px）")
        process_directory(target_path, target_size_kb=30, max_dimension=1920)
        print("🎉 所有图片处理完成！")
    
    elif os.path.isfile(target_path):
        print(f"🚀 开始处理文件: {os.path.basename(target_path)}")
        # 单文件压缩：目标100KB，最大1920px，WebP格式
        compress_image(
            target_path,
            output_path=target_path,  # 覆盖原文件，扩展名不变，但内容为WebP
            target_size_kb=30,
            max_dimension=1920,
            output_format="webp"
        )
        print("🎉 图片处理完成！")
    
    else:
        print(f"❌ 错误: 路径 '{target_path}' 不是有效的文件夹或文件。")