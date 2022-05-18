from django.contrib import admin
from .models import *
# Register your models here.


class UserAdmin(admin.ModelAdmin):
    list_display = [field.name for field in ModelUser._meta.get_fields()]


class TransactionAdmin(admin.ModelAdmin):
    list_display = [field.name for field in ModelTransaction._meta.get_fields()]


admin.site.register(ModelUser, UserAdmin)
admin.site.register(ModelTransaction, TransactionAdmin)
