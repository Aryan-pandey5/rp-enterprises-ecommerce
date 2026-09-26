import os
import django
import io
from PIL import Image

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework_simplejwt.tokens import RefreshToken
from categories.models import Category
from products.models import Product

def create_test_image_file(name='test_img.png', color='red'):
    file_obj = io.BytesIO()
    image = Image.new('RGB', (100, 100), color=color)
    image.save(file_obj, 'PNG')
    file_obj.seek(0)
    return SimpleUploadedFile(name, file_obj.read(), content_type='image/png')

def test_image_flow():
    print("=== STARTING PRODUCT IMAGE FLOW AUTOMATED VERIFICATION ===")

    # Clean up test user & category
    User.objects.filter(username="img_test_admin").delete()
    Category.objects.filter(name="Image Test Category").delete()

    admin_user = User.objects.create_user(
        username="img_test_admin",
        password="AdminPassword123!",
        is_staff=True
    )
    admin_token = str(RefreshToken.for_user(admin_user).access_token)

    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_token}')

    # 1. Create Category
    res_cat = client.post('/api/categories/', {
        'name': 'Image Test Category',
        'category_type': 'DISPOSABLE',
        'description': 'Category for image testing'
    }, format='json')
    assert res_cat.status_code == 201, f"Category creation failed: {res_cat.data}"
    cat_id = res_cat.data['id']
    print(f"[SUCCESS 1/6] Created test category ID={cat_id}")

    # 2. Create Product WITH Image
    img_file1 = create_test_image_file('red_product.png', 'red')
    prod_payload = {
        'name': 'Test Image Disposable Plate',
        'category': cat_id,
        'size': '10 inch',
        'base_price': '350.00',
        'description': 'Disposable paper plate with image',
        'is_active': 'true',
        'image': img_file1
    }
    res_create = client.post('/api/products/', prod_payload, format='multipart')
    assert res_create.status_code == 201, f"Product creation with image failed: {res_create.data}"
    prod_id = res_create.data['id']
    img_url_1 = res_create.data.get('image_url')
    assert img_url_1 is not None, "image_url should not be None after image upload"
    assert 'red_product' in img_url_1, f"Image URL does not contain uploaded file name: {img_url_1}"
    print(f"[SUCCESS 2/6] Created Product ID={prod_id} with Image URL: {img_url_1}")

    # 3. Update Product details WITHOUT selecting new image (Verify Image Preservation)
    edit_payload_1 = {
        'name': 'Test Image Disposable Plate (Updated Price)',
        'category': cat_id,
        'size': '10 inch',
        'base_price': '400.00',
        'description': 'Disposable paper plate updated price',
        'is_active': 'true',
    }
    res_edit_1 = client.put(f'/api/products/{prod_id}/', edit_payload_1, format='multipart')
    assert res_edit_1.status_code == 200, f"Product edit failed: {res_edit_1.data}"
    img_url_after_edit = res_edit_1.data.get('image_url')
    assert img_url_after_edit is not None, "FAIL: Image was deleted/cleared on product edit when no image was uploaded!"
    assert img_url_after_edit == img_url_1, f"FAIL: Image URL changed when no new image was sent: {img_url_after_edit} vs {img_url_1}"
    print(f"[SUCCESS 3/6] Updated Product details without image - Existing image preserved perfectly: {img_url_after_edit}")

    # 4. Update Product WITH a NEW Image file
    img_file2 = create_test_image_file('blue_product.png', 'blue')
    edit_payload_2 = edit_payload_1.copy()
    edit_payload_2['image'] = img_file2
    res_edit_2 = client.put(f'/api/products/{prod_id}/', edit_payload_2, format='multipart')
    assert res_edit_2.status_code == 200, f"Product image update failed: {res_edit_2.data}"
    img_url_2 = res_edit_2.data.get('image_url')
    assert img_url_2 is not None and 'blue_product' in img_url_2, f"FAIL: New image file was not set correctly: {img_url_2}"
    print(f"[SUCCESS 4/6] Updated Product with NEW Image file - New Image URL: {img_url_2}")

    # 5. Explicitly Remove Image using remove_image=true
    edit_payload_3 = edit_payload_1.copy()
    edit_payload_3['remove_image'] = 'true'
    res_edit_3 = client.put(f'/api/products/{prod_id}/', edit_payload_3, format='multipart')
    assert res_edit_3.status_code == 200, f"Product remove image failed: {res_edit_3.data}"
    assert res_edit_3.data.get('image_url') is None, f"FAIL: Image should be None after remove_image=true, got {res_edit_3.data.get('image_url')}"
    print(f"[SUCCESS 5/6] Removed Product image using remove_image=true - image_url is now None.")

    # 6. Cleanup
    client.delete(f'/api/products/{prod_id}/')
    Category.objects.filter(id=cat_id).delete()
    admin_user.delete()
    print("[SUCCESS 6/6] Cleaned up test resources successfully.")

    print("\n=== ALL PRODUCT IMAGE FLOW TESTS PASSED 100% PERFECTLY ===")

if __name__ == '__main__':
    test_image_flow()
