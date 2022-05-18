from django.urls import path
from . import views

urlpatterns = [
    path('register', views.register, name='register'),
    path('', views.transfer, name='transfer'),
    path('submit_verify', views.submit_verify, name='submit_verify'),
    path('get_recipient', views.get_recipient, name='get_recipient'),
    path('save_transaction', views.save_transaction, name='save_transaction'),
    path('get_addy_transfer_data', views.get_addy_transfer_data, name='get_addy_transfer_data'),
    path('account/<token>', views.account_address, name='_account'),
    path('account', views.account, name='account'),

]
