from django.db import models
from datetime import datetime
# Create your models here.


class ModelUser(models.Model):
    url = models.CharField(max_length=255, blank=True)
    justification = models.CharField(max_length=255, blank=True)
    address = models.CharField(max_length=255, blank=True)
    proof_path = models.CharField(max_length=255, blank=True)
    is_approved = models.BooleanField(default=False)
    create_date = models.DateTimeField(blank=True, default=datetime.now())


class ModelTransaction(models.Model):
    url = models.CharField(max_length=255, blank=True)
    amount = models.FloatField(default=0)
    coin = models.CharField(max_length=10, blank=True)
    from_address = models.CharField(max_length=255, blank=True)
    to_address = models.CharField(max_length=255, blank=True)
    chain_id = models.CharField(max_length=10, blank=True)
    tx_hash = models.CharField(max_length=255, blank=True)
    create_date = models.DateTimeField(blank=True)
