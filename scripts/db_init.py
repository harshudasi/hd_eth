from __future__ import print_function
import MySQLdb

# import mysql.connector
# from mysql.connector import errorcode


host='localhost'
username='root'
password='a'
_db='eth_auxpay'
db=MySQLdb.connect(host, username, password, _db)



cursor = db.cursor()

sql =""" CREATE TABLE user_master (user_name VARCHAR(45) PRIMARY KEY, token VARCHAR(45), notification_url VARCHAR(200)); """
cursor.execute(sql)

sql = """ CREATE TABLE address_master (address VARCHAR(100), priv_key VARCHAR(100), user VARCHAR(45)); """
cursor.execute(sql)

sql = """ CREATE TABLE transaction_details (txid VARCHAR(100),from_address VARCHAR(100), to_address VARCHAR(100), value VARCHAR(45), timestamp VARCHAR(45), conformations VARCHAR(45),flag VARCHAR(45)); """
cursor.execute(sql)

#sql = """ CREATE TABLE transaction_details (txid VARCHAR(45),from_address VARCHAR(45), to_address VARCHAR(45), value VARCHAR(45), timestamp VARCHAR(45), conformations VARCHAR(45),flag VARCHAR(45)); """
#cursor.execute(sql)



db.commit()
db.close()